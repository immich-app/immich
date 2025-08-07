import { Injectable } from '@nestjs/common';
import { join } from 'node:path';
import { StorageCore } from 'src/cores/storage.core';
import { OnEvent, OnJob } from 'src/decorators';
import {
  BootstrapEventPriority,
  DatabaseLock,
  JobName,
  JobStatus,
  QueueName,
  StorageFolder,
  SystemMetadataKey,
} from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { JobOf, SystemFlags } from 'src/types';
import { ImmichStartupError } from 'src/utils/misc';

const docsMessage = `Please see https://immich.app/docs/administration/system-integrity#folder-checks for more information.`;

@Injectable()
export class StorageService extends BaseService {
  private detectMediaLocation(): string {
    const envData = this.configRepository.getEnv();
    if (envData.storage.mediaLocation) {
      return envData.storage.mediaLocation;
    }

    const targets: string[] = [];
    const candidates = ['/data', '/usr/src/app/upload'];

    for (const candidate of candidates) {
      const exists = this.storageRepository.existsSync(candidate);
      if (exists) {
        targets.push(candidate);
      }
    }

    if (targets.length === 1) {
      return targets[0];
    }

    return '/usr/src/app/upload';
  }

  @OnEvent({ name: 'AppBootstrap', priority: BootstrapEventPriority.StorageService })
  async onBootstrap() {
    StorageCore.setMediaLocation(this.detectMediaLocation());

    await this.databaseRepository.withLock(DatabaseLock.SystemFileMounts, async () => {
      const flags =
        (await this.systemMetadataRepository.get(SystemMetadataKey.SystemFlags)) ||
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

          if (!flags.mountChecks[folder]) {
            flags.mountChecks[folder] = true;
            updated = true;
          }
        }

        if (updated) {
          await this.systemMetadataRepository.set(SystemMetadataKey.SystemFlags, flags);
          this.logger.log('Successfully enabled system mount folders checks');
        }

        this.logger.log('Successfully verified system mount folder checks');
      } catch (error) {
        const envData = this.configRepository.getEnv();
        if (envData.storage.ignoreMountCheckErrors) {
          this.logger.error(error as Error);
          this.logger.warn('Ignoring mount folder errors');
        } else {
          throw error;
        }
      }
    });

    await this.databaseRepository.withLock(DatabaseLock.MediaLocation, async () => {
      const current = StorageCore.getMediaLocation();
      const samples = await this.assetRepository.getFileSamples();
      const savedValue = await this.systemMetadataRepository.get(SystemMetadataKey.MediaLocation);
      if (samples.length > 0) {
        const path = samples[0].path;

        let previous = savedValue?.location || '';

        if (!previous && this.configRepository.getEnv().storage.mediaLocation) {
          previous = current;
        }

        if (!previous) {
          previous = path.startsWith('upload/') ? 'upload' : '/usr/src/app/upload';
        }

        if (previous !== current) {
          this.logger.log(`Media location changed (from=${previous}, to=${current})`);

          if (!path.startsWith(previous)) {
            throw new Error(
              'Detected an inconsistent media location. For more information, see https://immich.app/errors#inconsistent-media-location',
            );
          }

          this.logger.warn(
            `Detected a change to media location, performing an automatic migration of file paths from ${previous} to ${current}, this may take awhile`,
          );
          await this.databaseRepository.migrateFilePaths(previous, current);
        }
      }

      // Only set MediaLocation in systemMetadataRepository if needed
      if (savedValue?.location !== current) {
        await this.systemMetadataRepository.set(SystemMetadataKey.MediaLocation, { location: current });
      }
    });
  }

  @OnJob({ name: JobName.FileDelete, queue: QueueName.BackgroundTask })
  async handleDeleteFiles(job: JobOf<JobName.FileDelete>): Promise<JobStatus> {
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

    return JobStatus.Success;
  }

  private async verifyReadAccess(folder: StorageFolder) {
    const { internalPath, externalPath } = this.getMountFilePaths(folder);
    try {
      await this.storageRepository.readFile(internalPath);
    } catch (error) {
      this.logger.error(`Failed to read (${internalPath}): ${error}`);
      throw new ImmichStartupError(`Failed to read: "${externalPath} (${internalPath}) - ${docsMessage}"`);
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
