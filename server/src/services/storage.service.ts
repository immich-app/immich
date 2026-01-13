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
  StorageBackend,
  StorageFolder,
  StorageLocationType,
  SystemMetadataKey,
} from 'src/enum';
import { S3StorageAdapter } from 'src/repositories/storage/s3-storage.adapter';
import { BaseService } from 'src/services/base.service';
import { JobOf, SystemFlags } from 'src/types';
import { ImmichStartupError } from 'src/utils/misc';

const docsMessage = `Please see https://docs.immich.app/administration/system-integrity#folder-checks for more information.`;

/**
 * Error thrown when S3 connectivity check fails.
 * This is a fatal error that cannot be ignored.
 */
class S3ConnectivityError extends ImmichStartupError {
  constructor(message: string) {
    super(message);
    this.name = 'S3ConnectivityError';
  }
}

/**
 * Mapping from StorageFolder to StorageLocationType.
 * Upload folder is not included as it is always local (temp storage).
 */
const FOLDER_TO_LOCATION: Partial<Record<StorageFolder, StorageLocationType>> = {
  [StorageFolder.Library]: StorageLocationType.Originals,
  [StorageFolder.Thumbnails]: StorageLocationType.Thumbnails,
  [StorageFolder.EncodedVideo]: StorageLocationType.EncodedVideos,
  [StorageFolder.Profile]: StorageLocationType.Profile,
  [StorageFolder.Backups]: StorageLocationType.Backups,
  // StorageFolder.Upload is intentionally omitted - always local
};

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

    // Get config to determine which folders use S3
    const config = await this.getConfig({ withCache: false });

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
        // Perform S3 health check if any location uses S3
        if (this.isS3EnabledForAnyLocation(config)) {
          await this.verifyS3Connectivity(config);
        }

        // Check each folder exists and is writable (only for local storage)
        for (const folder of Object.values(StorageFolder)) {
          // Skip local mount check for folders configured to use S3
          if (!this.shouldCheckLocalMount(folder, config)) {
            this.logger.log(`Skipping local mount check for ${folder} folder (configured for S3)`);
            // Mark as checked since S3 health was verified above
            if (!flags.mountChecks[folder]) {
              flags.mountChecks[folder] = true;
              updated = true;
            }
            continue;
          }

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
        // S3 connectivity errors are always fatal (no ignore flag)
        if (error instanceof S3ConnectivityError) {
          throw error;
        }
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
              'Detected an inconsistent media location. For more information, see https://docs.immich.app/errors#inconsistent-media-location',
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

  /**
   * Check if a folder should use local storage based on configuration.
   * Upload folder is always local. Other folders depend on storage.locations config.
   */
  private shouldCheckLocalMount(folder: StorageFolder, config: { storage: { locations: { originals: StorageBackend; thumbnails: StorageBackend; previews: StorageBackend; encodedVideos: StorageBackend; profile: StorageBackend; backups: StorageBackend } } }): boolean {
    // Upload folder is always local (temp storage for incoming files)
    if (folder === StorageFolder.Upload) {
      return true;
    }

    const locationType = FOLDER_TO_LOCATION[folder];
    if (!locationType) {
      // Unknown folder type - default to local check
      return true;
    }

    // Map StorageLocationType to config key
    switch (locationType) {
      case StorageLocationType.Originals:
        return config.storage.locations.originals === StorageBackend.Local;
      case StorageLocationType.Thumbnails:
        return config.storage.locations.thumbnails === StorageBackend.Local;
      case StorageLocationType.Previews:
        return config.storage.locations.previews === StorageBackend.Local;
      case StorageLocationType.EncodedVideos:
        return config.storage.locations.encodedVideos === StorageBackend.Local;
      case StorageLocationType.Profile:
        return config.storage.locations.profile === StorageBackend.Local;
      case StorageLocationType.Backups:
        return config.storage.locations.backups === StorageBackend.Local;
      default:
        return true;
    }
  }

  /**
   * Check if S3 is enabled for any storage location.
   */
  private isS3EnabledForAnyLocation(config: { storage: { s3: { enabled: boolean }; locations: Record<string, StorageBackend> } }): boolean {
    if (!config.storage.s3.enabled) {
      return false;
    }
    return Object.values(config.storage.locations).some((backend) => backend === StorageBackend.S3);
  }

  /**
   * Verify S3 connectivity using HeadBucket API.
   * This is a fatal check - no ignore flag.
   */
  private async verifyS3Connectivity(config: { storage: { s3: { enabled: boolean; endpoint: string; bucket: string; region: string; accessKeyId: string; secretAccessKey: string; prefix: string; forcePathStyle: boolean } } }): Promise<void> {
    this.logger.log('Verifying S3 connectivity...');
    try {
      const s3Adapter = new S3StorageAdapter({
        endpoint: config.storage.s3.endpoint || undefined,
        region: config.storage.s3.region,
        bucket: config.storage.s3.bucket,
        accessKeyId: config.storage.s3.accessKeyId,
        secretAccessKey: config.storage.s3.secretAccessKey,
        prefix: config.storage.s3.prefix,
        forcePathStyle: config.storage.s3.forcePathStyle,
      });
      await s3Adapter.healthCheck();
      this.logger.log('S3 connectivity verified successfully');
    } catch (error) {
      this.logger.error(`S3 connectivity check failed: ${error}`);
      throw new S3ConnectivityError(
        `Failed to connect to S3 bucket "${config.storage.s3.bucket}": ${error}. ` +
        `Please verify your S3 configuration (endpoint, bucket, credentials).`
      );
    }
  }
}
