import { Injectable } from '@nestjs/common';
import { join } from 'node:path';
import { StorageCore } from 'src/cores/storage.core';
import { OnEvent, OnJob } from 'src/decorators';
import { DatabaseLock, JobName, JobStatus, QueueName, StorageFolder, SystemMetadataKey } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { JobOf, SystemFlags } from 'src/types';
import { ImmichStartupError } from 'src/utils/misc';

const docsMessage = `Please see https://immich.app/docs/administration/system-integrity#folder-checks for more information.`;

@Injectable()
export class StorageService extends BaseService {
  @OnEvent({ name: 'app.bootstrap' })
  async onBootstrap() {
    const envData = this.configRepository.getEnv();

    await this.databaseRepository.withLock(DatabaseLock.SystemFileMounts, async () => {
      const flags =
        (await this.systemMetadataRepository.get(SystemMetadataKey.SYSTEM_FLAGS)) ||
        ({ mountChecks: {} } as SystemFlags);

      if (!flags.mountChecks) {
        flags.mountChecks = {};
      }

      let updated = false;

      this.logger.log(`Verifying system mount folder checks, current state: ${JSON.stringify(flags)}`);

      try {
        // check each folder exists and is writable
        for (const folder of Object.values(StorageFolder)) {
          if (!flags.mountChecks[folder]) {
            this.logger.log(`Writing initial mount file for the ${folder} folder`);
            await this.createMountFile(folder);
          }

          await this.verifyReadAccess(folder);
          await this.verifyWriteAccess(folder);

          // Ensure README.TXT is created in UPLOAD and LIBRARY folders only
          if ([StorageFolder.UPLOAD, StorageFolder.LIBRARY].includes(folder)) {
            await this.createReadmeFile(folder);
          }

          if (!flags.mountChecks[folder]) {
            flags.mountChecks[folder] = true;
            updated = true;
          }
        }

        if (updated) {
          await this.systemMetadataRepository.set(SystemMetadataKey.SYSTEM_FLAGS, flags);
          this.logger.log('Successfully enabled system mount folders checks');
        }

        this.logger.log('Successfully verified system mount folder checks');
      } catch (error) {
        if (envData.storage.ignoreMountCheckErrors) {
          this.logger.error(error as Error);
          this.logger.warn('Ignoring mount folder errors');
        } else {
          throw error;
        }
      }
    });
  }

  async createReadmeFile(folder: StorageFolder) {
    const { folderPath } = this.getMountFilePaths(folder);
    const readmePath = join(folderPath, 'README.TXT');
    const warningMessage = `WARNING: Do not modify/delete the contents of the Upload folder as it may cause unexpected errors and database incompatibilities.\n\n` +
                           `Please refer to the documentation for more information:\n` +
                           `https://immich.app/docs/administration/backup-and-restore#asset-types-and-storage-locations`;

    try {
      let exists = false;
      try {
        await this.storageRepository.stat(readmePath);
        exists = true;
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }

      if (exists) {
        this.logger.log('README.TXT already exists, skipping creation');
        return;
      }

      await this.storageRepository.createFile(readmePath, Buffer.from(warningMessage));
      this.logger.log(`README.TXT file created at ${readmePath}`);
    } catch (error) {
      this.logger.error(`Failed to create README.TXT in ${folderPath}: ${error}`);
      throw new ImmichStartupError(`Failed to create README.TXT in "${folderPath} - ${docsMessage}"`);
    }
  }
}


  @OnJob({ name: JobName.DELETE_FILES, queue: QueueName.BACKGROUND_TASK })
  async handleDeleteFiles(job: JobOf<JobName.DELETE_FILES>): Promise<JobStatus> {
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
    const { internalPath, externalPath } = this.getMountFilePaths(folder);
    try {
      await this.storageRepository.readFile(internalPath);
    } catch (error) {
      this.logger.error(`Failed to read ${internalPath}: ${error}`);
      throw new ImmichStartupError(`Failed to read "${externalPath} - ${docsMessage}"`);
    }
  }

  private async createMountFile(folder: StorageFolder) {
    const { folderPath, internalPath, externalPath } = this.getMountFilePaths(folder);
    try {
      this.storageRepository.mkdirSync(folderPath);
      await this.storageRepository.createFile(internalPath, Buffer.from(`${Date.now()}`));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
        this.logger.warn('Found existing mount file, skipping creation');
        return;
      }
      this.logger.error(`Failed to create ${internalPath}: ${error}`);
      throw new ImmichStartupError(`Failed to create "${externalPath} - ${docsMessage}"`);
    }
  }

  private async verifyWriteAccess(folder: StorageFolder) {
    const { internalPath, externalPath } = this.getMountFilePaths(folder);
    try {
      await this.storageRepository.overwriteFile(internalPath, Buffer.from(`${Date.now()}`));
    } catch (error) {
      this.logger.error(`Failed to write ${internalPath}: ${error}`);
      throw new ImmichStartupError(`Failed to write "${externalPath} - ${docsMessage}"`);
    }
  }

  private getMountFilePaths(folder: StorageFolder) {
    const folderPath = StorageCore.getBaseFolder(folder);
    const internalPath = join(folderPath, '.immich');
    const externalPath = `<UPLOAD_LOCATION>/${folder}/.immich`;

    return { folderPath, internalPath, externalPath };
  }
}
