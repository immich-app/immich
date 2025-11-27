import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { JOBS_LIBRARY_PAGINATION_SIZE } from 'src/constants';
import { StorageCore } from 'src/cores/storage.core';
import { OnEvent, OnJob } from 'src/decorators';
import { ImmichWorker, JobName, JobStatus, QueueName, StorageFolder, SystemMetadataKey } from 'src/enum';
import { ArgOf } from 'src/repositories/event.repository';
import { BaseService } from 'src/services/base.service';
import { IIntegrityMissingFilesJob, IIntegrityOrphanedFilesJob } from 'src/types';

@Injectable()
export class IntegrityService extends BaseService {
  // private backupLock = false;

  @OnEvent({ name: 'ConfigInit', workers: [ImmichWorker.Microservices] })
  async onConfigInit({
    newConfig: {
      backup: { database },
    },
  }: ArgOf<'ConfigInit'>) {
    // this.backupLock = await this.databaseRepository.tryLock(DatabaseLock.BackupDatabase);
    // if (this.backupLock) {
    //   this.cronRepository.create({
    //     name: 'backupDatabase',
    //     expression: database.cronExpression,
    //     onTick: () => handlePromiseError(this.jobRepository.queue({ name: JobName.DatabaseBackup }), this.logger),
    //     start: database.enabled,
    //   });
    // }
    setTimeout(() => {
      // this.jobRepository.queue({
      //   name: JobName.IntegrityOrphanedFilesQueueAll,
      //   data: {},
      // });

      // this.jobRepository.queue({
      //   name: JobName.IntegrityMissingFilesQueueAll,
      //   data: {},
      // });

      this.jobRepository.queue({
        name: JobName.IntegrityChecksumFiles,
        data: {},
      });
    }, 1000);
  }

  @OnEvent({ name: 'ConfigUpdate', server: true })
  async onConfigUpdate({ newConfig: { backup } }: ArgOf<'ConfigUpdate'>) {
    // if (!this.backupLock) {
    //   return;
    // }
    // this.cronRepository.update({
    //   name: 'backupDatabase',
    //   expression: backup.database.cronExpression,
    //   start: backup.database.enabled,
    // });
  }

  @OnJob({ name: JobName.IntegrityOrphanedFilesQueueAll, queue: QueueName.BackgroundTask })
  async handleOrphanedFilesQueueAll(): Promise<JobStatus> {
    this.logger.log(`Scanning for orphaned files...`);

    const assetPaths = this.storageRepository.walk({
      pathsToCrawl: [StorageFolder.EncodedVideo, StorageFolder.Library, StorageFolder.Upload].map((folder) =>
        StorageCore.getBaseFolder(folder),
      ),
      includeHidden: false,
      take: JOBS_LIBRARY_PAGINATION_SIZE,
    });

    const assetFilePaths = this.storageRepository.walk({
      pathsToCrawl: [StorageCore.getBaseFolder(StorageFolder.Thumbnails)],
      includeHidden: false,
      take: JOBS_LIBRARY_PAGINATION_SIZE,
    });

    async function* paths() {
      for await (const batch of assetPaths) {
        yield ['asset', batch] as const;
      }

      for await (const batch of assetFilePaths) {
        yield ['asset_file', batch] as const;
      }
    }

    let total = 0;
    for await (const [batchType, batchPaths] of paths()) {
      await this.jobRepository.queue({
        name: JobName.IntegrityOrphanedFiles,
        data: {
          type: batchType,
          paths: batchPaths,
        },
      });

      const count = batchPaths.length;
      total += count;

      this.logger.log(`Queued orphan check of ${count} file(s) (${total} so far)`);
    }

    return JobStatus.Success;
  }

  @OnJob({ name: JobName.IntegrityOrphanedFiles, queue: QueueName.BackgroundTask })
  async handleOrphanedFiles({ type, paths }: IIntegrityOrphanedFilesJob): Promise<JobStatus> {
    this.logger.log(`Processing batch of ${paths.length} files to check if they are orphaned.`);

    const orphanedFiles = new Set<string>(paths);
    if (type === 'asset') {
      const assets = await this.assetJobRepository.getAssetPathsByPaths(paths);
      for (const { originalPath, encodedVideoPath } of assets) {
        orphanedFiles.delete(originalPath);

        if (encodedVideoPath) {
          orphanedFiles.delete(encodedVideoPath);
        }
      }
    } else {
      const assets = await this.assetJobRepository.getAssetFilePathsByPaths(paths);
      for (const { path } of assets) {
        orphanedFiles.delete(path);
      }
    }

    // todo: do something with orphanedFiles
    console.info(orphanedFiles);

    this.logger.log(`Processed ${paths.length} and found ${orphanedFiles.size} orphaned file(s).`);
    return JobStatus.Success;
  }

  @OnJob({ name: JobName.IntegrityMissingFilesQueueAll, queue: QueueName.BackgroundTask })
  async handleMissingFilesQueueAll(): Promise<JobStatus> {
    this.logger.log(`Scanning for missing files...`);

    const assetPaths = this.assetJobRepository.streamAssetPaths();
    const assetFilePaths = this.assetJobRepository.streamAssetFilePaths();

    async function* paths() {
      for await (const { originalPath, encodedVideoPath } of assetPaths) {
        yield originalPath;

        if (encodedVideoPath) {
          yield encodedVideoPath;
        }
      }

      for await (const { path } of assetFilePaths) {
        yield path;
      }
    }

    async function* chunk<T>(generator: AsyncGenerator<T>, n: number) {
      let chunk: T[] = [];
      for await (const item of generator) {
        chunk.push(item);

        if (chunk.length === n) {
          yield chunk;
          chunk = [];
        }
      }

      if (chunk.length) {
        yield chunk;
      }
    }

    let total = 0;
    for await (const batchPaths of chunk(paths(), JOBS_LIBRARY_PAGINATION_SIZE)) {
      await this.jobRepository.queue({
        name: JobName.IntegrityMissingFiles,
        data: {
          paths: batchPaths,
        },
      });

      total += batchPaths.length;
      this.logger.log(`Queued missing check of ${batchPaths.length} file(s) (${total} so far)`);
    }

    return JobStatus.Success;
  }

  @OnJob({ name: JobName.IntegrityMissingFiles, queue: QueueName.BackgroundTask })
  async handleMissingFiles({ paths }: IIntegrityMissingFilesJob): Promise<JobStatus> {
    this.logger.log(`Processing batch of ${paths.length} files to check if they are missing.`);

    const result = await Promise.all(
      paths.map((path) =>
        stat(path)
          .then(() => void 0)
          .catch(() => path),
      ),
    );

    const missingFiles = result.filter((path) => path);

    // todo: do something with missingFiles
    console.info(missingFiles);

    this.logger.log(`Processed ${paths.length} and found ${missingFiles.length} missing file(s).`);
    return JobStatus.Success;
  }

  @OnJob({ name: JobName.IntegrityChecksumFiles, queue: QueueName.BackgroundTask })
  async handleChecksumFiles(): Promise<JobStatus> {
    const timeLimit = 60 * 60 * 1000; // 1000;
    const percentageLimit = 1.0; // 0.25;

    this.logger.log(
      `Checking file checksums... (will run for up to ${(timeLimit / (60 * 60 * 1000)).toFixed(2)} hours or until ${(percentageLimit * 100).toFixed(2)}% of assets are processed)`,
    );

    let processed = 0;
    const startedAt = Date.now();
    const { count } = await this.assetJobRepository.getAssetCount();
    const checkpoint = await this.systemMetadataRepository.get(SystemMetadataKey.IntegrityChecksumCheckpoint);

    let startMarker: Date | undefined = checkpoint?.date ? new Date(checkpoint.date) : undefined;
    let endMarker: Date | undefined; // todo

    const printStats = () => {
      const averageTime = ((Date.now() - startedAt) / processed).toFixed(2);
      const completionProgress = ((processed / count) * 100).toFixed(2);

      this.logger.log(
        `Processed ${processed} files so far... (avg. ${averageTime} ms/asset, ${completionProgress}% of all assets)`,
      );
    };

    let lastCreatedAt: Date | undefined;

    finishEarly: do {
      this.logger.log(
        `Processing assets in range [${startMarker?.toISOString() ?? 'beginning'}, ${endMarker?.toISOString() ?? 'end'}]`,
      );

      const assets = this.assetJobRepository.streamAssetChecksums(startMarker, endMarker);
      endMarker = startMarker;
      startMarker = undefined;

      for await (const { originalPath, checksum, createdAt } of assets) {
        try {
          const hash = createHash('sha1');

          await pipeline([
            createReadStream(originalPath),
            new Writable({
              write(chunk, _encoding, callback) {
                hash.update(chunk);
                callback();
              },
            }),
          ]);

          if (!checksum.equals(hash.digest())) {
            throw new Error('File failed checksum');
          }
        } catch (error) {
          this.logger.warn('Failed to process a file: ' + error);
          // todo: do something with originalPath
        }

        processed++;
        if (processed % 100 === 0) {
          printStats();
        }

        if (Date.now() > startedAt + timeLimit || processed > count * percentageLimit) {
          this.logger.log('Reached stop criteria.');
          lastCreatedAt = createdAt;
          break finishEarly;
        }
      }
    } while (endMarker);

    this.systemMetadataRepository.set(SystemMetadataKey.IntegrityChecksumCheckpoint, {
      date: lastCreatedAt?.toISOString(),
    });

    printStats();

    if (lastCreatedAt) {
      this.logger.log(`Finished checksum job, will continue from ${lastCreatedAt.toISOString()}.`);
    } else {
      this.logger.log(`Finished checksum job, covered all assets.`);
    }

    return JobStatus.Success;
  }
}
