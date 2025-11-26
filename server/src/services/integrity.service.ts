import { Injectable } from '@nestjs/common';
import { JOBS_LIBRARY_PAGINATION_SIZE } from 'src/constants';
import { StorageCore } from 'src/cores/storage.core';
import { OnEvent, OnJob } from 'src/decorators';
import { ImmichWorker, JobName, JobStatus, QueueName, StorageFolder } from 'src/enum';
import { ArgOf } from 'src/repositories/event.repository';
import { BaseService } from 'src/services/base.service';

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
      this.jobRepository.queue({
        name: JobName.IntegrityOrphanedAndMissingFiles,
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

  @OnJob({ name: JobName.IntegrityOrphanedAndMissingFiles, queue: QueueName.BackgroundTask })
  async handleOrphanedAndMissingFiles(): Promise<JobStatus> {
    // (1) Asset files
    const pathsLocal = new Set<string>();
    const pathsDb = new Set<string>();

    await Promise.all([
      // scan all local paths
      (async () => {
        const pathsOnDisk = this.storageRepository.walk({
          pathsToCrawl: [
            StorageFolder.EncodedVideo,
            StorageFolder.Library,
            StorageFolder.Upload,
            StorageFolder.Thumbnails,
          ].map((folder) => StorageCore.getBaseFolder(folder)),
          includeHidden: false,
          take: JOBS_LIBRARY_PAGINATION_SIZE,
        });

        for await (const pathBatch of pathsOnDisk) {
          for (const path of pathBatch) {
            if (!pathsDb.delete(path)) {
              pathsLocal.add(path);
            }

            console.info(pathsLocal.size, pathsDb.size);
          }
        }
      })(),
      // scan "asset"
      (async () => {
        const pathsInDb = await this.assetRepository.getAllAssetPaths();

        for await (const { originalPath, encodedVideoPath } of pathsInDb) {
          if (!pathsLocal.delete(originalPath)) {
            pathsDb.add(originalPath);
          }

          if (encodedVideoPath && !pathsLocal.delete(encodedVideoPath)) {
            pathsDb.add(encodedVideoPath);
          }

          console.info(pathsLocal.size, pathsDb.size);
        }
      })(),
      // scan "asset_files"
      (async () => {
        const pathsInDb = await this.assetRepository.getAllAssetFilePaths();

        for await (const { path } of pathsInDb) {
          if (!pathsLocal.delete(path)) {
            pathsDb.add(path);
          }

          console.info(pathsLocal.size, pathsDb.size);
        }
      })(),
    ]);

    console.info('Orphaned files:', pathsLocal);
    console.info('Missing files:', pathsDb);

    // profile: skipped
    return JobStatus.Success;
  }

  @OnJob({ name: JobName.IntegrityChecksumFiles, queue: QueueName.BackgroundTask })
  async handleChecksumFiles(): Promise<JobStatus> {
    // todo
    return JobStatus.Success;
  }
}
