import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
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

      await this.syncNodeRepository.updatePairing(pairingId, { lastSyncedAt: new Date(), error: null });
      return JobStatus.Success;
    } catch (error: any) {
      this.logger.error(`Sync failed for pairing ${pairingId}: ${error?.message ?? error}`, error?.stack);
      await this.syncNodeRepository.updatePairing(pairingId, { error: error?.message ?? String(error) });
      return JobStatus.Failed;
    }
  }

  /**
   * Local -> remote. Walks local changes in `updateId` order, so the cursor only
   * ever moves forward and an interrupted run resumes from where it stopped.
   */
  private async push(pairingId: string): Promise<void> {
    const context = await this.getContext(pairingId);
    if (!context) {
      return;
    }

    const { pairing, credentials } = context;
    let cursor = pairing.pushCursor;

    for (;;) {
      const assets = await this.syncNodeRepository.getChangedAssets(pairing.localUserId, cursor, PUSH_PAGE_SIZE);
      if (assets.length === 0) {
        break;
      }

      for (const asset of assets) {
        await this.pushOne(pairingId, credentials, asset);
      }

      cursor = assets.at(-1)!.updateId;

      // Persist after every page so a crash costs at most one page of rework.
      await this.syncNodeRepository.updatePairing(pairingId, { pushCursor: cursor });

      if (assets.length < PUSH_PAGE_SIZE) {
        break;
      }
    }
  }

  private async pushOne(
    pairingId: string,
    credentials: NodeCredentials,
    asset: Awaited<ReturnType<typeof this.syncNodeRepository.getChangedAssets>>[number],
  ): Promise<void> {
    // External and offline assets have no bytes here to send.
    if (asset.isExternal || asset.isOffline) {
      return;
    }

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

      return JobStatus.Success;
    } catch (error: any) {
      this.logger.error(`Failed to pull ${assetId}: ${error?.message ?? error}`, error?.stack);
      if (localPath) {
        await this.jobRepository.queue({ name: JobName.FileDelete, data: { files: [localPath] } });
      }
      return JobStatus.Failed;
    }
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
