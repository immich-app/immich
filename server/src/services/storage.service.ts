import { Inject, Injectable } from '@nestjs/common';
import { join } from 'node:path';
import { StorageCore, StorageFolder } from 'src/cores/storage.core';
import { OnEmit } from 'src/decorators';
import { SystemMetadataKey } from 'src/enum';
import { DatabaseLock, IDatabaseRepository } from 'src/interfaces/database.interface';
import { IDeleteFilesJob, JobStatus } from 'src/interfaces/job.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IStorageRepository } from 'src/interfaces/storage.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { ImmichStartupError } from 'src/utils/events';

@Injectable()
export class StorageService {
  constructor(
    @Inject(IDatabaseRepository) private databaseRepository: IDatabaseRepository,
    @Inject(IStorageRepository) private storageRepository: IStorageRepository,
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
    @Inject(ISystemMetadataRepository) private systemMetadata: ISystemMetadataRepository,
  ) {
    this.logger.setContext(StorageService.name);
  }

  @OnEmit({ event: 'app.bootstrap' })
  async onBootstrap() {
    await this.databaseRepository.withLock(DatabaseLock.SystemFileMounts, async () => {
      const flags = (await this.systemMetadata.get(SystemMetadataKey.SYSTEM_FLAGS)) || { mountFiles: false };

      this.logger.log('Verifying system mount folder checks');

      // check each folder exists and is writable
      for (const folder of Object.values(StorageFolder)) {
        if (!flags.mountFiles) {
          this.logger.log(`Writing initial mount file for the ${folder} folder`);
          await this.verifyWriteAccess(folder);
        }

        await this.verifyReadAccess(folder);
        await this.verifyWriteAccess(folder);
      }

      if (!flags.mountFiles) {
        flags.mountFiles = true;
        await this.systemMetadata.set(SystemMetadataKey.SYSTEM_FLAGS, flags);
        this.logger.log('Successfully enabled system mount folders checks');
      }

      this.logger.log('Successfully verified system mount folder checks');
    });
  }

  async handleDeleteFiles(job: IDeleteFilesJob) {
    const { files } = job;

    // TODO: one job per file
    for (const file of files) {
      if (!file) {
        continue;
      }

      try {
        await this.storageRepository.unlink(file);
      } catch (error: any) {
        this.logger.warn('Unable to remove file from disk', error);
      }
    }

    return JobStatus.SUCCESS;
  }

  private async verifyReadAccess(folder: StorageFolder) {
    const { filePath } = this.getMountFilePaths(folder);
    try {
      await this.storageRepository.readFile(filePath);
    } catch (error) {
      this.logger.error(`Failed to read ${filePath}: ${error}`);
      this.logger.error(
        `The "${folder}" folder appears to be offline/missing, please make sure the volume is mounted with the correct permissions`,
      );
      throw new ImmichStartupError(`Failed to validate folder mount (read from "<MEDIA_LOCATION>/${folder}")`);
    }
  }

  private async verifyWriteAccess(folder: StorageFolder) {
    const { folderPath, filePath } = this.getMountFilePaths(folder);
    try {
      this.storageRepository.mkdirSync(folderPath);
      await this.storageRepository.writeFile(filePath, Buffer.from(`${Date.now()}`));
    } catch (error) {
      this.logger.error(`Failed to write ${filePath}: ${error}`);
      this.logger.error(
        `The "${folder}" folder cannot be written to, please make sure the volume is mounted with the correct permissions`,
      );
      throw new ImmichStartupError(`Failed to validate folder mount (write to "<MEDIA_LOCATION>/${folder}")`);
    }
  }

  private getMountFilePaths(folder: StorageFolder) {
    const folderPath = StorageCore.getBaseFolder(folder);
    const filePath = join(folderPath, '.immich');

    return { folderPath, filePath };
  }
}
