import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { NODE_SYNC_MAX_ATTEMPTS } from 'src/constants';
import { StorageCore } from 'src/cores/storage.core';
import { OnEvent, OnJob } from 'src/decorators';
import {
  AssetVisibility,
  ChecksumAlgorithm,
  DatabaseLock,
  ImmichWorker,
  JobName,
  JobStatus,
  QueueName,
  StorageFolder,
  SyncDirection,
} from 'src/enum';
import { ArgOf } from 'src/repositories/event.repository';
import { NodeCredentials } from 'src/repositories/node-client.repository';
import { BaseService } from 'src/services/base.service';
import { INodeSyncAssetJob, INodeSyncPairJob } from 'src/types';
import { getFilenameExtension } from 'src/utils/file';
import { mimeTypes } from 'src/utils/mime-types';
import { handlePromiseError } from 'src/utils/misc';

/** How many local changes one pair run walks through before stopping. */
const PUSH_PAGE_SIZE = 500;
const PULL_PAGE_SIZE = 250;
const RETRY_PAGE_SIZE = 500;

@Injectable()
export class SyncEngineService extends BaseService {
  private syncLock = false;

  @OnEvent({ name: 'ConfigInit', workers: [ImmichWorker.Microservices] })
  async onConfigInit({ newConfig: { nodeSync } }: ArgOf<'ConfigInit'>) {
    // Only one microservices worker should own the schedule, or every replica
    // would kick off the same sync.
    this.syncLock = await this.databaseRepository.tryLock(DatabaseLock.NodeSync);
    if (!this.syncLock) {
      return;
    }

    this.cronRepository.create({
      name: 'nodeSync',
      expression: nodeSync.cronExpression,
      onTick: () =>
        handlePromiseError(this.jobRepository.queue({ name: JobName.NodeSyncQueueAll, data: {} }), this.logger),
      start: nodeSync.enabled,
    });
  }

  @OnEvent({ name: 'ConfigUpdate', server: true })
  onConfigUpdate({ newConfig: { nodeSync } }: ArgOf<'ConfigUpdate'>) {
    if (!this.syncLock) {
      return;
    }

    this.cronRepository.update({
      name: 'nodeSync',
      expression: nodeSync.cronExpression,
      start: nodeSync.enabled,
    });
  }

  @OnJob({ name: JobName.NodeSyncQueueAll, queue: QueueName.NodeSync })
  async handleQueueAll(): Promise<JobStatus> {
    const pairings = await this.syncNodeRepository.getSyncablePairings();

    for (const { id } of pairings) {
      await this.jobRepository.queue({ name: JobName.NodeSyncPair, data: { pairingId: id } });
    }

    this.logger.log(`Queued ${pairings.length} node sync pairing(s)`);
    return JobStatus.Success;
  }

  @OnJob({ name: JobName.NodeSyncPair, queue: QueueName.NodeSync })
  async handlePair({ pairingId }: INodeSyncPairJob): Promise<JobStatus> {
    const context = await this.getContext(pairingId);
    if (!context) {
      return JobStatus.Skipped;
    }

    const { pairing } = context;

    try {
      if (pairing.pushEnabled) {
        await this.push(pairingId);
      }

      if (pairing.pullEnabled) {
        await this.pull(pairingId);
      }

      await this.jobRepository.queue({ name: JobName.NodeSyncAlbums, data: { pairingId } });

      // Anything that failed earlier in this run, or was left over from a previous
      // one, gets another attempt now rather than waiting for the next schedule.
      await this.jobRepository.queue({ name: JobName.NodeSyncRetryFailed, data: { pairingId } });

      await this.syncNodeRepository.updatePairing(pairingId, { lastSyncedAt: new Date(), error: null });
      return JobStatus.Success;
    } catch (error: any) {
      this.logger.error(`Sync failed for pairing ${pairingId}: ${error?.message ?? error}`, error?.stack);
      await this.syncNodeRepository.updatePairing(pairingId, { error: error?.message ?? String(error) });
      return JobStatus.Failed;
    }
  }

  /**
   * Local -> remote. Walks local changes in `updateId` order and queues a job per
   * asset, so several transfers run at once under the queue's concurrency rather
   * than one at a time.
   *
   * The cursor advances once a page has been *queued*, not once it has finished.
   * That is safe because every queued item is recorded in the work ledger first,
   * so nothing is forgotten -- and it means one unco-operative asset can no
   * longer pin the cursor and force every later run to re-attempt the same page.
   */
  private async push(pairingId: string): Promise<void> {
    const context = await this.getContext(pairingId);
    if (!context) {
      return;
    }

    const { pairing } = context;
    let cursor = pairing.pushCursor;

    for (;;) {
      const assets = await this.syncNodeRepository.getChangedAssets(pairing.localUserId, cursor, PUSH_PAGE_SIZE);
      if (assets.length === 0) {
        break;
      }

      // Assets with no local bytes are skipped here rather than queued, so they
      // never enter the ledger and never look like outstanding work.
      const transferable = assets.filter((asset) => !asset.isExternal && !asset.isOffline);

      await this.syncNodeRepository.markQueued(
        pairingId,
        SyncDirection.Push,
        transferable.map(({ id }) => id),
      );

      for (const asset of transferable) {
        await this.jobRepository.queue({
          name: JobName.NodeSyncPushAsset,
          data: { pairingId, assetId: asset.id },
        });
      }

      cursor = assets.at(-1)!.updateId;
      await this.syncNodeRepository.updatePairing(pairingId, { pushCursor: cursor });

      if (assets.length < PUSH_PAGE_SIZE) {
        break;
      }
    }
  }

  @OnJob({ name: JobName.NodeSyncPushAsset, queue: QueueName.NodeSync })
  async handlePushAsset({ pairingId, assetId }: INodeSyncAssetJob): Promise<JobStatus> {
    const context = await this.getContext(pairingId);
    if (!context) {
      return JobStatus.Skipped;
    }

    const [asset] = await this.syncNodeRepository.getAssetsByIds([assetId]);
    if (!asset) {
      // Deleted outright since being queued; there is nothing left to send.
      await this.syncNodeRepository.markSucceeded(pairingId, SyncDirection.Push, assetId);
      return JobStatus.Skipped;
    }

    try {
      await this.pushOne(pairingId, context.credentials, asset);
      await this.syncNodeRepository.markSucceeded(pairingId, SyncDirection.Push, assetId);
      return JobStatus.Success;
    } catch (error: any) {
      // One difficult asset must not stop the rest. It stays in the ledger and
      // is picked up by the retry pass at the end of the next run.
      const message = error?.message ?? String(error);
      this.logger.warn(`Failed to push ${assetId}, will retry later: ${message}`);
      await this.syncNodeRepository.markFailed(pairingId, SyncDirection.Push, assetId, message);
      return JobStatus.Failed;
    }
  }

  private async pushOne(
    pairingId: string,
    credentials: NodeCredentials,
    asset: Awaited<ReturnType<typeof this.syncNodeRepository.getChangedAssets>>[number],
  ): Promise<void> {
    const mapping = await this.syncNodeRepository.getAssetMapping(pairingId, asset.id);

    if (asset.deletedAt) {
      // Trashed locally. Mirror that on the peer, once.
      if (mapping && !mapping.trashSyncedAt) {
        await this.nodeClientRepository.trashAssets(credentials, [mapping.remoteAssetId]);
        await this.syncNodeRepository.updateAssetMapping(mapping.id, { trashSyncedAt: new Date() });
        this.logger.debug(`Propagated trash of ${asset.id} to ${mapping.remoteAssetId}`);
      }
      return;
    }

    if (asset.visibility === AssetVisibility.Hidden) {
      return;
    }

    if (mapping) {
      // Already on the peer. Only metadata can have changed.
      if (mapping.metadataUpdateId !== asset.updateId) {
        await this.nodeClientRepository.updateAsset(credentials, mapping.remoteAssetId, {
          isFavorite: asset.isFavorite,
          description: asset.description ?? undefined,
        });
        await this.syncNodeRepository.updateAssetMapping(mapping.id, { metadataUpdateId: asset.updateId });
      }
      return;
    }

    const checksum = asset.checksum.toString('base64');

    // If the peer already holds these exact bytes, adopt its asset rather than
    // uploading a second copy. This is what makes two nodes converge instead of
    // duplicating each other's libraries.
    const existing = await this.nodeClientRepository.bulkUploadCheck(credentials, [{ id: asset.id, checksum }]);
    const duplicate = existing[asset.id];

    if (duplicate?.action === 'reject' && duplicate.assetId) {
      await this.syncNodeRepository.upsertAssetMapping({
        nodeUserId: pairingId,
        localAssetId: asset.id,
        remoteAssetId: duplicate.assetId,
        checksum: asset.checksum,
        origin: 'push-dedupe',
        metadataUpdateId: asset.updateId,
      });
      return;
    }

    const sidecarPath = `${asset.originalPath}.xmp`;
    const hasSidecar = await this.storageRepository.checkFileExists(sidecarPath);

    const uploaded = await this.nodeClientRepository.uploadAsset(credentials, {
      // Reusing the local id gives the peer a stable per-device identity, so a
      // repeated push is recognised rather than duplicated.
      deviceAssetId: asset.id,
      deviceId: `immich-node-sync`,
      fileCreatedAt: new Date(asset.fileCreatedAt),
      fileModifiedAt: new Date(asset.fileModifiedAt),
      isFavorite: asset.isFavorite,
      filename: asset.originalFileName,
      path: asset.originalPath,
      sidecar: hasSidecar ? { filename: `${asset.originalFileName}.xmp`, path: sidecarPath } : undefined,
    });

    await this.syncNodeRepository.upsertAssetMapping({
      nodeUserId: pairingId,
      localAssetId: asset.id,
      remoteAssetId: uploaded.id,
      checksum: asset.checksum,
      origin: 'push',
      metadataUpdateId: asset.updateId,
    });
  }

  /**
   * Remote -> local. The peer is queried through its public search API, which
   * filters on `updatedAfter`, so this side advances on a timestamp.
   */
  private async pull(pairingId: string): Promise<void> {
    const context = await this.getContext(pairingId);
    if (!context) {
      return;
    }

    const { pairing, credentials } = context;
    const startedAt = new Date();

    let page = 1;
    for (;;) {
      const { items, nextPage } = await this.nodeClientRepository.searchAssets(credentials, {
        userId: pairing.remoteUserId,
        updatedAfter: pairing.pullCursor ? new Date(pairing.pullCursor) : undefined,
        page,
        size: PULL_PAGE_SIZE,
      });

      if (items.length === 0) {
        break;
      }

      const known = await this.syncNodeRepository.getMappedRemoteIds(
        pairingId,
        items.map(({ id }) => id),
      );

      const unseen = items.filter(({ id }) => !known.has(id));

      await this.syncNodeRepository.markQueued(
        pairingId,
        SyncDirection.Pull,
        unseen.map(({ id }) => id),
      );

      for (const remote of unseen) {
        await this.jobRepository.queue({
          name: JobName.NodeSyncPullAsset,
          data: { pairingId, assetId: remote.id },
        });
      }

      if (!nextPage) {
        break;
      }
      page = Number(nextPage);
    }

    // Only advance once the whole page walk succeeded, so a mid-way failure
    // re-examines the same window rather than skipping it.
    await this.syncNodeRepository.updatePairing(pairingId, { pullCursor: startedAt });
  }

  @OnJob({ name: JobName.NodeSyncPullAsset, queue: QueueName.NodeSync })
  async handlePullAsset({ pairingId, assetId }: INodeSyncAssetJob): Promise<JobStatus> {
    const context = await this.getContext(pairingId);
    if (!context) {
      return JobStatus.Skipped;
    }

    const { pairing, credentials } = context;

    const existing = await this.syncNodeRepository.getMappingByRemoteId(pairingId, assetId);
    if (existing) {
      await this.syncNodeRepository.markSucceeded(pairingId, SyncDirection.Pull, assetId);
      return JobStatus.Skipped;
    }

    const uuid = randomUUID();
    const folder = StorageCore.getNestedFolder(StorageFolder.Upload, pairing.localUserId, uuid);
    let localPath = '';

    try {
      const remote = await this.nodeClientRepository.getRemoteAsset(credentials, assetId);
      if (!mimeTypes.isAsset(remote.originalFileName)) {
        return JobStatus.Skipped;
      }

      localPath = join(folder, `${uuid}${getFilenameExtension(remote.originalFileName)}`);
      this.storageRepository.mkdirSync(folder);

      const stream = await this.nodeClientRepository.downloadAsset(credentials, assetId);
      const writeStream = this.storageRepository.createWriteStream(localPath);
      await new Promise<void>((resolve, reject) => {
        stream.on('error', reject);
        writeStream.on('error', reject);
        writeStream.on('finish', () => resolve());
        stream.pipe(writeStream);
      });

      const checksum = await this.cryptoRepository.hashFile(localPath);

      // Same bytes already here: map the two together and drop the download,
      // which is what stops a pull re-importing what this node pushed earlier.
      const duplicateId = await this.assetRepository.getUploadAssetIdByChecksum(pairing.localUserId, checksum);
      if (duplicateId) {
        await this.jobRepository.queue({ name: JobName.FileDelete, data: { files: [localPath] } });
        await this.syncNodeRepository.upsertAssetMapping({
          nodeUserId: pairingId,
          localAssetId: duplicateId,
          remoteAssetId: assetId,
          checksum,
          origin: 'pull-dedupe',
        });
        await this.syncNodeRepository.markSucceeded(pairingId, SyncDirection.Pull, assetId);
        return JobStatus.Skipped;
      }

      const stats = await this.storageRepository.stat(localPath);

      const asset = await this.assetRepository.create({
        ownerId: pairing.localUserId,
        libraryId: null,
        checksum,
        checksumAlgorithm: ChecksumAlgorithm.sha1File,
        originalPath: localPath,
        fileCreatedAt: new Date(remote.fileCreatedAt),
        fileModifiedAt: new Date(remote.fileModifiedAt),
        localDateTime: new Date(remote.fileCreatedAt),
        type: mimeTypes.assetType(remote.originalFileName),
        isFavorite: remote.isFavorite,
        visibility: AssetVisibility.Timeline,
        originalFileName: remote.originalFileName,
      });

      await this.assetRepository.upsertExif({
        exif: { assetId: asset.id, fileSizeInByte: stats.size, description: remote.description ?? '' },
        lockedPropertiesBehavior: 'override',
      });

      await this.syncNodeRepository.upsertAssetMapping({
        nodeUserId: pairingId,
        localAssetId: asset.id,
        remoteAssetId: assetId,
        checksum,
        origin: 'pull',
      });

      await this.jobRepository.queue({ name: JobName.AssetExtractMetadata, data: { id: asset.id, source: 'upload' } });

      await this.syncNodeRepository.markSucceeded(pairingId, SyncDirection.Pull, assetId);
      return JobStatus.Success;
    } catch (error: any) {
      // Recorded rather than rethrown, so the rest of the run carries on and this
      // item is reconsidered by the retry pass.
      const message = error?.message ?? String(error);
      this.logger.warn(`Failed to pull ${assetId}, will retry later: ${message}`);
      if (localPath) {
        await this.jobRepository.queue({ name: JobName.FileDelete, data: { files: [localPath] } });
      }
      await this.syncNodeRepository.markFailed(pairingId, SyncDirection.Pull, assetId, message);
      return JobStatus.Failed;
    }
  }

  /**
   * Re-queues outstanding work for a pairing: items that failed, and items that
   * were queued but never reported back -- which is what a lost queue looks like.
   *
   * Items past the attempt ceiling are left alone and surfaced in the UI instead,
   * so a genuinely broken asset stops consuming bandwidth on every run but is
   * still visible rather than silently dropped.
   */
  @OnJob({ name: JobName.NodeSyncRetryFailed, queue: QueueName.NodeSync })
  async handleRetryFailed({ pairingId }: INodeSyncPairJob): Promise<JobStatus> {
    const context = await this.getContext(pairingId);
    if (!context) {
      return JobStatus.Skipped;
    }

    const items = await this.syncNodeRepository.getRetryableItems(pairingId, NODE_SYNC_MAX_ATTEMPTS, RETRY_PAGE_SIZE);
    if (items.length === 0) {
      return JobStatus.Success;
    }

    for (const item of items) {
      await this.jobRepository.queue({
        name: item.direction === SyncDirection.Push ? JobName.NodeSyncPushAsset : JobName.NodeSyncPullAsset,
        data: { pairingId, assetId: item.assetId },
      });
    }

    this.logger.log(`Re-queued ${items.length} outstanding sync item(s) for pairing ${pairingId}`);
    return JobStatus.Success;
  }

  /**
   * Reconciles albums after assets have moved, so membership can reference
   * assets that already exist on both sides. Albums are matched by name.
   */
  @OnJob({ name: JobName.NodeSyncAlbums, queue: QueueName.NodeSync })
  async handleAlbums({ pairingId }: INodeSyncPairJob): Promise<JobStatus> {
    const context = await this.getContext(pairingId);
    if (!context) {
      return JobStatus.Skipped;
    }

    const { pairing, credentials } = context;
    if (!pairing.pushEnabled) {
      return JobStatus.Skipped;
    }

    try {
      const localAlbums = await this.syncNodeRepository.getAlbumsForOwner(pairing.localUserId);
      const remoteAlbums = await this.nodeClientRepository.getAlbums(credentials);
      const mappings = await this.syncNodeRepository.getAlbumMappings(pairingId);
      const mappedByLocal = new Map(mappings.map((mapping) => [mapping.localAlbumId, mapping]));

      for (const album of localAlbums) {
        let remoteAlbumId = mappedByLocal.get(album.id)?.remoteAlbumId;

        if (!remoteAlbumId) {
          const byName = remoteAlbums.find((remote) => remote.albumName === album.albumName);
          if (byName) {
            remoteAlbumId = byName.id;
          } else {
            const created = await this.nodeClientRepository.createAlbum(credentials, {
              albumName: album.albumName,
              description: album.description ?? undefined,
            });
            remoteAlbumId = created.id;
          }

          await this.syncNodeRepository.upsertAlbumMapping({
            nodeUserId: pairingId,
            localAlbumId: album.id,
            remoteAlbumId,
          });
        }

        const localAssetIds = await this.syncNodeRepository.getAlbumAssetIds(album.id);
        const remoteIds: string[] = [];
        for (const { assetId } of localAssetIds) {
          const mapping = await this.syncNodeRepository.getAssetMapping(pairingId, assetId);
          if (mapping) {
            remoteIds.push(mapping.remoteAssetId);
          }
        }

        if (remoteIds.length > 0) {
          // The peer ignores assets already in the album, so this is idempotent.
          await this.nodeClientRepository.addAssetsToAlbum(credentials, remoteAlbumId, remoteIds);
        }
      }

      return JobStatus.Success;
    } catch (error: any) {
      this.logger.error(`Album sync failed for pairing ${pairingId}: ${error?.message ?? error}`, error?.stack);
      return JobStatus.Failed;
    }
  }

  private async getContext(pairingId: string) {
    const pairing = await this.syncNodeRepository.getPairing(pairingId);
    if (!pairing) {
      this.logger.warn(`Pairing ${pairingId} no longer exists, skipping`);
      return null;
    }

    const node = await this.syncNodeRepository.get(pairing.nodeId);
    if (!node || !node.isEnabled) {
      return null;
    }

    return {
      pairing,
      node,
      // Asset endpoints act as whoever owns the key, so all data movement uses
      // the paired user's own key. The node-level key is only for admin work.
      credentials: { url: node.url, apiKey: pairing.apiKey } satisfies NodeCredentials,
    };
  }
}
