import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { basename, join, relative } from 'node:path';
import { StorageCore } from 'src/cores/storage.core';
import { OnJob } from 'src/decorators';
import {
  AssetFileType,
  AssetVisibility,
  ChecksumAlgorithm,
  JobName,
  JobStatus,
  QueueName,
  StorageFolder,
  StorageTransferStatus,
} from 'src/enum';
import { StorageTargetRef } from 'src/repositories/remote-storage.repository';
import { BaseService } from 'src/services/base.service';
import { IStorageTransferAssetJob, IStorageTransferJob, IStorageTransferObjectJob } from 'src/types';
import { getFilenameExtension } from 'src/utils/file';
import { mimeTypes } from 'src/utils/mime-types';

@Injectable()
export class StorageTransferService extends BaseService {
  @OnJob({ name: JobName.StorageTargetExportQueue, queue: QueueName.StorageTarget })
  async handleExportQueue({ transferId }: IStorageTransferJob): Promise<JobStatus> {
    const transfer = await this.storageTargetRepository.getTransfer(transferId);
    if (!transfer) {
      this.logger.warn(`Transfer ${transferId} no longer exists, skipping`);
      return JobStatus.Skipped;
    }

    await this.storageTargetRepository.updateTransfer(transferId, {
      status: StorageTransferStatus.Running,
      startedAt: new Date(),
    });

    const assets = this.storageTargetRepository.streamAssetsForExport(transfer.ownerId, transfer.scope);

    let total = 0;
    for await (const { id } of assets) {
      await this.jobRepository.queue({
        name: JobName.StorageTargetExportAsset,
        data: { transferId, assetId: id },
      });
      total++;
    }

    this.logger.log(`Queued ${total} asset(s) for export to storage target ${transfer.targetId}`);

    // The total is only known after the stream is drained, so it is written last.
    // Workers that finished early are reconciled by the closing check below.
    await this.storageTargetRepository.updateTransfer(transferId, { totalCount: total });

    if (total === 0) {
      await this.storageTargetRepository.updateTransfer(transferId, {
        status: StorageTransferStatus.Completed,
        finishedAt: new Date(),
      });
    } else {
      await this.storageTargetRepository.incrementTransferProgress(transferId, {});
    }

    return JobStatus.Success;
  }

  @OnJob({ name: JobName.StorageTargetExportAsset, queue: QueueName.StorageTarget })
  async handleExportAsset({ transferId, assetId }: IStorageTransferAssetJob): Promise<JobStatus> {
    const transfer = await this.storageTargetRepository.getTransfer(transferId);
    if (!transfer || transfer.status === StorageTransferStatus.Cancelled) {
      return JobStatus.Skipped;
    }

    const target = await this.storageTargetRepository.get(transfer.targetId);
    if (!target) {
      this.logger.warn(`Storage target ${transfer.targetId} no longer exists, skipping export`);
      return JobStatus.Skipped;
    }

    const asset = await this.storageTargetRepository.getAssetForExport(assetId);
    if (!asset) {
      await this.storageTargetRepository.incrementTransferProgress(transferId, { failed: 1 });
      return JobStatus.Skipped;
    }

    // Already on the target from an earlier run: nothing to do, which is what
    // makes re-running an export cheap.
    const existing = await this.storageTargetRepository.getObjectByAsset(target.id, assetId);
    if (existing) {
      await this.storageTargetRepository.incrementTransferProgress(transferId, { completed: 1 });
      return JobStatus.Skipped;
    }

    const remoteKey = this.getRemoteKey(asset.ownerId, asset.originalPath);

    try {
      const { size } = await this.storageRepository.stat(asset.originalPath);
      const stream = this.storageRepository.createPlainReadStream(asset.originalPath);

      await this.remoteStorageRepository.upload(target, remoteKey, stream, {
        size,
        contentType: mimeTypes.lookup(asset.originalPath),
      });

      // Sidecars carry user-edited metadata, so an export without them would not
      // round-trip faithfully.
      const sidecarPath = `${asset.originalPath}.xmp`;
      if (await this.storageRepository.checkFileExists(sidecarPath)) {
        const sidecarStats = await this.storageRepository.stat(sidecarPath);
        await this.remoteStorageRepository.upload(
          target,
          `${remoteKey}.xmp`,
          this.storageRepository.createPlainReadStream(sidecarPath),
          { size: sidecarStats.size, contentType: 'application/xml' },
        );
      }

      await this.storageTargetRepository.upsertObject({
        targetId: target.id,
        remoteKey,
        assetId,
        size,
        checksum: asset.checksum,
      });

      await this.storageTargetRepository.incrementTransferProgress(transferId, { completed: 1 });
      return JobStatus.Success;
    } catch (error: any) {
      // One bad object must not abort the whole transfer, so failures are counted
      // and the run continues.
      this.logger.error(`Failed to export asset ${assetId} to ${remoteKey}: ${error}`, error?.stack);
      await this.storageTargetRepository.incrementTransferProgress(transferId, { failed: 1 });
      return JobStatus.Failed;
    }
  }

  @OnJob({ name: JobName.StorageTargetImportScan, queue: QueueName.StorageTarget })
  async handleImportScan({ transferId }: IStorageTransferJob): Promise<JobStatus> {
    const transfer = await this.storageTargetRepository.getTransfer(transferId);
    if (!transfer) {
      this.logger.warn(`Transfer ${transferId} no longer exists, skipping`);
      return JobStatus.Skipped;
    }

    const target = await this.storageTargetRepository.get(transfer.targetId);
    if (!target) {
      this.logger.warn(`Storage target ${transfer.targetId} no longer exists, skipping import`);
      return JobStatus.Skipped;
    }

    await this.storageTargetRepository.updateTransfer(transferId, {
      status: StorageTransferStatus.Running,
      startedAt: new Date(),
    });

    let total = 0;

    try {
      for await (const batch of this.remoteStorageRepository.list(target)) {
        const candidates = batch.filter(({ key }) => mimeTypes.isAsset(key));

        // The ledger holds every object this instance has put on the target as
        // well as every one it has taken off, so exports are skipped here too.
        // That is deliberate: without it, importing from a backup target would
        // feed a user's own library back in as duplicates on every run.

        const newKeys = await this.storageTargetRepository.filterNewRemoteKeys(
          target.id,
          candidates.map(({ key }) => key),
        );
        const newKeySet = new Set(newKeys);
        const newObjects = candidates.filter(({ key }) => newKeySet.has(key));

        for (const object of newObjects) {
          await this.jobRepository.queue({
            name: JobName.StorageTargetImportObject,
            data: { transferId, remoteKey: object.key, size: object.size },
          });
          total++;
        }
      }
    } catch (error: any) {
      this.logger.error(`Failed to scan storage target ${target.id}: ${error}`, error?.stack);
      await this.storageTargetRepository.updateTransfer(transferId, {
        status: StorageTransferStatus.Failed,
        finishedAt: new Date(),
        error: error?.message ?? String(error),
      });
      return JobStatus.Failed;
    }

    this.logger.log(`Queued ${total} object(s) for import from storage target ${target.id}`);

    await this.storageTargetRepository.updateTransfer(transferId, { totalCount: total });

    if (total === 0) {
      await this.storageTargetRepository.updateTransfer(transferId, {
        status: StorageTransferStatus.Completed,
        finishedAt: new Date(),
      });
    } else {
      await this.storageTargetRepository.incrementTransferProgress(transferId, {});
    }

    return JobStatus.Success;
  }

  @OnJob({ name: JobName.StorageTargetImportObject, queue: QueueName.StorageTarget })
  async handleImportObject({ transferId, remoteKey, size }: IStorageTransferObjectJob): Promise<JobStatus> {
    const transfer = await this.storageTargetRepository.getTransfer(transferId);
    if (!transfer || transfer.status === StorageTransferStatus.Cancelled) {
      return JobStatus.Skipped;
    }

    const target = await this.storageTargetRepository.get(transfer.targetId);
    if (!target) {
      return JobStatus.Skipped;
    }

    const ownerId = transfer.ownerId;
    const uuid = randomUUID();
    const originalName = basename(remoteKey);
    const localPath = join(
      StorageCore.getNestedFolder(StorageFolder.Upload, ownerId, uuid),
      `${uuid}${getFilenameExtension(originalName)}`,
    );

    try {
      this.storageRepository.mkdirSync(StorageCore.getNestedFolder(StorageFolder.Upload, ownerId, uuid));

      const remoteStream = await this.remoteStorageRepository.createReadStream(target, remoteKey);
      const writeStream = this.storageRepository.createWriteStream(localPath);
      await new Promise<void>((resolve, reject) => {
        remoteStream.on('error', reject);
        writeStream.on('error', reject);
        writeStream.on('finish', () => resolve());
        remoteStream.pipe(writeStream);
      });

      const checksum = await this.cryptoRepository.hashFile(localPath);

      // Content-addressed dedupe: if the user already has these exact bytes we
      // record the mapping and drop the download rather than creating a duplicate.
      const duplicate = await this.assetRepository.getUploadAssetIdByChecksum(ownerId, checksum);
      if (duplicate) {
        await this.jobRepository.queue({ name: JobName.FileDelete, data: { files: [localPath] } });
        await this.storageTargetRepository.upsertObject({
          targetId: target.id,
          remoteKey,
          assetId: duplicate,
          size,
          checksum,
        });
        await this.storageTargetRepository.incrementTransferProgress(transferId, { completed: 1 });
        return JobStatus.Skipped;
      }

      const stats = await this.storageRepository.stat(localPath);

      const asset = await this.assetRepository.create({
        ownerId,
        libraryId: null,
        checksum,
        checksumAlgorithm: ChecksumAlgorithm.sha1File,
        originalPath: localPath,
        // The remote store is not a reliable source of capture time; metadata
        // extraction corrects these from EXIF right after this job.
        fileCreatedAt: stats.mtime,
        fileModifiedAt: stats.mtime,
        localDateTime: stats.mtime,
        type: mimeTypes.assetType(originalName),
        visibility: AssetVisibility.Timeline,
        originalFileName: originalName,
      });

      // A sibling `.xmp` on the target belongs to this asset, so it comes across too.
      await this.importSidecar(target, remoteKey, asset.id, ownerId, uuid);

      await this.assetRepository.upsertExif({
        exif: { assetId: asset.id, fileSizeInByte: stats.size },
        lockedPropertiesBehavior: 'override',
      });

      await this.storageTargetRepository.upsertObject({
        targetId: target.id,
        remoteKey,
        assetId: asset.id,
        size: stats.size,
        checksum,
      });

      await this.jobRepository.queue({
        name: JobName.AssetExtractMetadata,
        data: { id: asset.id, source: 'upload' },
      });

      await this.storageTargetRepository.incrementTransferProgress(transferId, { completed: 1 });
      return JobStatus.Success;
    } catch (error: any) {
      this.logger.error(`Failed to import ${remoteKey}: ${error}`, error?.stack);
      await this.jobRepository.queue({ name: JobName.FileDelete, data: { files: [localPath] } });
      await this.storageTargetRepository.incrementTransferProgress(transferId, { failed: 1 });
      return JobStatus.Failed;
    }
  }

  private async importSidecar(
    target: StorageTargetRef,
    remoteKey: string,
    assetId: string,
    ownerId: string,
    uuid: string,
  ) {
    const sidecarKey = `${remoteKey}.xmp`;

    const sidecar = await this.remoteStorageRepository.head(target, sidecarKey).catch(() => null);
    if (!sidecar) {
      return;
    }

    const sidecarPath = join(StorageCore.getNestedFolder(StorageFolder.Upload, ownerId, uuid), `${uuid}.xmp`);
    const stream = await this.remoteStorageRepository.createReadStream(target, sidecarKey);
    const writeStream = this.storageRepository.createWriteStream(sidecarPath);

    await new Promise<void>((resolve, reject) => {
      stream.on('error', reject);
      writeStream.on('error', reject);
      writeStream.on('finish', () => resolve());
      stream.pipe(writeStream);
    });

    await this.assetRepository.upsertFile({ assetId, path: sidecarPath, type: AssetFileType.Sidecar });
  }

  /**
   * Mirror the local library layout on the target so exports are stable across
   * runs and an exported tree can be imported back without losing structure.
   */
  private getRemoteKey(ownerId: string, originalPath: string): string {
    const libraryFolder = StorageCore.getBaseFolder(StorageFolder.Library);
    const relativePath = relative(libraryFolder, originalPath);

    // Assets that have not been through the storage template still live under the
    // upload folder, so fall back to a flat, owner-scoped key for those.
    if (relativePath.startsWith('..')) {
      return `${ownerId}/${basename(originalPath)}`;
    }

    return relativePath.replaceAll('\\', '/');
  }
}
