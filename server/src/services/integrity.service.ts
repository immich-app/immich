import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { JOBS_LIBRARY_PAGINATION_SIZE } from 'src/constants';
import { StorageCore } from 'src/cores/storage.core';
import { OnEvent, OnJob } from 'src/decorators';
import {
  DatabaseLock,
  ImmichWorker,
  IntegrityReportType,
  JobName,
  JobStatus,
  QueueName,
  StorageFolder,
  SystemMetadataKey,
} from 'src/enum';
import { ArgOf } from 'src/repositories/event.repository';
import { BaseService } from 'src/services/base.service';
import {
  IIntegrityJob,
  IIntegrityOrphanedFilesJob,
  IIntegrityPathWithChecksumJob,
  IIntegrityPathWithReportJob,
} from 'src/types';
import { handlePromiseError } from 'src/utils/misc';

async function* chunk<T>(generator: AsyncIterableIterator<T>, n: number) {
  let chunk: T[] = [];
  for await (const item of generator) {
    chunk.push(item);

    if (chunk.length === n) {
      yield chunk;
      chunk = [];
    }
  }

  if (chunk.length > 0) {
    yield chunk;
  }
}

@Injectable()
export class IntegrityService extends BaseService {
  private integrityLock = false;

  @OnEvent({ name: 'ConfigInit', workers: [ImmichWorker.Microservices] })
  async onConfigInit({
    newConfig: {
      integrityChecks: { orphanedFiles, missingFiles, checksumFiles },
    },
  }: ArgOf<'ConfigInit'>) {
    this.integrityLock = await this.databaseRepository.tryLock(DatabaseLock.IntegrityCheck);
    if (this.integrityLock) {
      this.cronRepository.create({
        name: 'integrityOrphanedFiles',
        expression: orphanedFiles.cronExpression,
        onTick: () =>
          handlePromiseError(
            this.jobRepository.queue({ name: JobName.IntegrityOrphanedFilesQueueAll, data: {} }),
            this.logger,
          ),
        start: orphanedFiles.enabled,
      });

      this.cronRepository.create({
        name: 'integrityMissingFiles',
        expression: missingFiles.cronExpression,
        onTick: () =>
          handlePromiseError(
            this.jobRepository.queue({ name: JobName.IntegrityMissingFilesQueueAll, data: {} }),
            this.logger,
          ),
        start: missingFiles.enabled,
      });

      this.cronRepository.create({
        name: 'integrityChecksumFiles',
        expression: checksumFiles.cronExpression,
        onTick: () =>
          handlePromiseError(this.jobRepository.queue({ name: JobName.IntegrityChecksumFiles, data: {} }), this.logger),
        start: checksumFiles.enabled,
      });
    }

    // debug: run on boot
    setImmediate(() => {
      void this.jobRepository.queue({
        name: JobName.IntegrityOrphanedFilesQueueAll,
        data: {},
      });

      void this.jobRepository.queue({
        name: JobName.IntegrityMissingFilesQueueAll,
        data: {},
      });

      void this.jobRepository.queue({
        name: JobName.IntegrityChecksumFiles,
        data: {},
      });
    });
  }

  @OnEvent({ name: 'ConfigUpdate', server: true })
  onConfigUpdate({
    newConfig: {
      integrityChecks: { orphanedFiles, missingFiles, checksumFiles },
    },
  }: ArgOf<'ConfigUpdate'>) {
    if (!this.integrityLock) {
      return;
    }

    this.cronRepository.update({
      name: 'integrityOrphanedFiles',
      expression: orphanedFiles.cronExpression,
      start: orphanedFiles.enabled,
    });

    this.cronRepository.update({
      name: 'integrityMissingFiles',
      expression: missingFiles.cronExpression,
      start: missingFiles.enabled,
    });

    this.cronRepository.update({
      name: 'integrityChecksumFiles',
      expression: checksumFiles.cronExpression,
      start: checksumFiles.enabled,
    });
  }

  @OnJob({ name: JobName.IntegrityOrphanedFilesQueueAll, queue: QueueName.BackgroundTask })
  async handleOrphanedFilesQueueAll({ refreshOnly }: IIntegrityJob = {}): Promise<JobStatus> {
    this.logger.log(`Checking for out of date orphaned file reports...`);

    const reports = this.assetJobRepository.streamIntegrityReports(IntegrityReportType.OrphanFile);

    let total = 0;
    for await (const batchReports of chunk(reports, JOBS_LIBRARY_PAGINATION_SIZE)) {
      await this.jobRepository.queue({
        name: JobName.IntegrityOrphanedFilesRefresh,
        data: {
          items: batchReports,
        },
      });

      total += batchReports.length;
      this.logger.log(`Queued report check of ${batchReports.length} report(s) (${total} so far)`);
    }

    if (refreshOnly) {
      this.logger.log('Refresh complete.');
      return JobStatus.Success;
    }

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

    total = 0;
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

    await this.integrityReportRepository.create(
      [...orphanedFiles].map((path) => ({
        type: IntegrityReportType.OrphanFile,
        path,
      })),
    );

    this.logger.log(`Processed ${paths.length} and found ${orphanedFiles.size} orphaned file(s).`);
    return JobStatus.Success;
  }

  @OnJob({ name: JobName.IntegrityOrphanedFilesRefresh, queue: QueueName.BackgroundTask })
  async handleOrphanedRefresh({ items: paths }: IIntegrityPathWithReportJob): Promise<JobStatus> {
    this.logger.log(`Processing batch of ${paths.length} reports to check if they are out of date.`);

    const results = await Promise.all(
      paths.map(({ reportId, path }) =>
        stat(path)
          .then(() => void 0)
          .catch(() => reportId),
      ),
    );

    const reportIds = results.filter(Boolean) as string[];

    if (reportIds.length > 0) {
      await this.integrityReportRepository.deleteByIds(reportIds);
    }

    this.logger.log(`Processed ${paths.length} paths and found ${reportIds.length} report(s) out of date.`);
    return JobStatus.Success;
  }

  @OnJob({ name: JobName.IntegrityMissingFilesQueueAll, queue: QueueName.BackgroundTask })
  async handleMissingFilesQueueAll({ refreshOnly }: IIntegrityJob = {}): Promise<JobStatus> {
    if (refreshOnly) {
      this.logger.log(`Checking for out of date missing file reports...`);

      const reports = this.assetJobRepository.streamIntegrityReports(IntegrityReportType.MissingFile);

      let total = 0;
      for await (const batchReports of chunk(reports, JOBS_LIBRARY_PAGINATION_SIZE)) {
        await this.jobRepository.queue({
          name: JobName.IntegrityMissingFilesRefresh,
          data: {
            items: batchReports,
          },
        });

        total += batchReports.length;
        this.logger.log(`Queued report check of ${batchReports.length} report(s) (${total} so far)`);
      }

      this.logger.log('Refresh complete.');
      return JobStatus.Success;
    }

    this.logger.log(`Scanning for missing files...`);

    const assetPaths = this.assetJobRepository.streamAssetPaths();

    let total = 0;
    for await (const batchPaths of chunk(assetPaths, JOBS_LIBRARY_PAGINATION_SIZE)) {
      await this.jobRepository.queue({
        name: JobName.IntegrityMissingFiles,
        data: {
          items: batchPaths,
        },
      });

      total += batchPaths.length;
      this.logger.log(`Queued missing check of ${batchPaths.length} file(s) (${total} so far)`);
    }

    return JobStatus.Success;
  }

  @OnJob({ name: JobName.IntegrityMissingFiles, queue: QueueName.BackgroundTask })
  async handleMissingFiles({ items: paths }: IIntegrityPathWithReportJob): Promise<JobStatus> {
    this.logger.log(`Processing batch of ${paths.length} files to check if they are missing.`);

    const results = await Promise.all(
      paths.map((file) =>
        stat(file.path)
          .then(() => ({ ...file, exists: true }))
          .catch(() => ({ ...file, exists: false })),
      ),
    );

    const outdatedReports = results
      .filter(({ exists, reportId }) => exists && reportId)
      .map(({ reportId }) => reportId!);

    if (outdatedReports.length > 0) {
      await this.integrityReportRepository.deleteByIds(outdatedReports);
    }

    const missingFiles = results.filter(({ exists }) => !exists);
    if (missingFiles.length > 0) {
      await this.integrityReportRepository.create(
        missingFiles.map(({ path }) => ({
          type: IntegrityReportType.MissingFile,
          path,
        })),
      );
    }

    this.logger.log(`Processed ${paths.length} and found ${missingFiles.length} missing file(s).`);
    return JobStatus.Success;
  }

  @OnJob({ name: JobName.IntegrityMissingFilesRefresh, queue: QueueName.BackgroundTask })
  async handleMissingRefresh({ items: paths }: IIntegrityPathWithReportJob): Promise<JobStatus> {
    this.logger.log(`Processing batch of ${paths.length} reports to check if they are out of date.`);

    const results = await Promise.all(
      paths.map(({ reportId, path }) =>
        stat(path)
          .then(() => reportId)
          .catch(() => void 0),
      ),
    );

    const reportIds = results.filter(Boolean) as string[];

    if (reportIds.length > 0) {
      await this.integrityReportRepository.deleteByIds(reportIds);
    }

    this.logger.log(`Processed ${paths.length} paths and found ${reportIds.length} report(s) out of date.`);
    return JobStatus.Success;
  }

  @OnJob({ name: JobName.IntegrityChecksumFiles, queue: QueueName.BackgroundTask })
  async handleChecksumFiles({ refreshOnly }: IIntegrityJob = {}): Promise<JobStatus> {
    if (refreshOnly) {
      this.logger.log(`Checking for out of date checksum file reports...`);

      const reports = this.assetJobRepository.streamIntegrityReports(IntegrityReportType.ChecksumFail);

      let total = 0;
      for await (const batchReports of chunk(reports, JOBS_LIBRARY_PAGINATION_SIZE)) {
        await this.jobRepository.queue({
          name: JobName.IntegrityChecksumFilesRefresh,
          data: {
            items: batchReports,
          },
        });

        total += batchReports.length;
        this.logger.log(`Queued report check of ${batchReports.length} report(s) (${total} so far)`);
      }

      this.logger.log('Refresh complete.');
      return JobStatus.Success;
    }

    const timeLimit = 60 * 60 * 1000; // 1000;
    const percentageLimit = 1; // 0.25;

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

      for await (const { originalPath, checksum, createdAt, reportId } of assets) {
        processed++;

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

          if (checksum.equals(hash.digest())) {
            if (reportId) {
              await this.integrityReportRepository.deleteById(reportId);
            }
          } else {
            throw new Error('File failed checksum');
          }
        } catch (error) {
          if ((error as { code?: string }).code === 'ENOENT') {
            if (reportId) {
              await this.integrityReportRepository.deleteById(reportId);
            }
            // missing file; handled by the missing files job
            continue;
          }

          this.logger.warn('Failed to process a file: ' + error);
          await this.integrityReportRepository.create({
            path: originalPath,
            type: IntegrityReportType.ChecksumFail,
          });
        }

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

    await this.systemMetadataRepository.set(SystemMetadataKey.IntegrityChecksumCheckpoint, {
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

  @OnJob({ name: JobName.IntegrityChecksumFilesRefresh, queue: QueueName.BackgroundTask })
  async handleChecksumRefresh({ items: paths }: IIntegrityPathWithChecksumJob): Promise<JobStatus> {
    this.logger.log(`Processing batch of ${paths.length} reports to check if they are out of date.`);

    const results = await Promise.all(
      paths.map(async ({ reportId, path, checksum }) => {
        console.info('chekc', reportId, path, checksum);
        if (!checksum) return reportId;

        try {
          const hash = createHash('sha1');

          await pipeline([
            createReadStream(path),
            new Writable({
              write(chunk, _encoding, callback) {
                hash.update(chunk);
                callback();
              },
            }),
          ]);

          console.info('compare', checksum, hash.digest());
          if (checksum.equals(hash.digest())) {
            return reportId;
          }
        } catch (error) {
          if ((error as { code?: string }).code === 'ENOENT') {
            return reportId;
          }
        }
      }),
    );

    const reportIds = results.filter(Boolean) as string[];

    if (reportIds.length > 0) {
      await this.integrityReportRepository.deleteByIds(reportIds);
    }

    this.logger.log(`Processed ${paths.length} paths and found ${reportIds.length} report(s) out of date.`);
    return JobStatus.Success;
  }
}
