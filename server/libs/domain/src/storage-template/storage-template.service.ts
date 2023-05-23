import { AssetEntity, SystemConfig } from '@app/infra/entities';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { IAssetRepository } from '../asset/asset.repository';
import { APP_MEDIA_LOCATION } from '../domain.constant';
import { getLivePhotoMotionFilename, usePagination } from '../domain.util';
import { IAssetJob, JOBS_ASSET_PAGINATION_SIZE } from '../job';
import { IStorageRepository } from '../storage/storage.repository';
import { INITIAL_SYSTEM_CONFIG, ISystemConfigRepository } from '../system-config';
import { IUserRepository } from '../user/user.repository';
import { StorageTemplateCore } from './storage-template.core';

export interface MoveAssetMetadata {
  storageLabel: string | null;
  filename: string;
}

@Injectable()
export class StorageTemplateService {
  private logger = new Logger(StorageTemplateService.name);
  private core: StorageTemplateCore;

  constructor(
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(ISystemConfigRepository) configRepository: ISystemConfigRepository,
    @Inject(INITIAL_SYSTEM_CONFIG) config: SystemConfig,
    @Inject(IStorageRepository) private storageRepository: IStorageRepository,
    @Inject(IUserRepository) private userRepository: IUserRepository,
  ) {
    this.core = new StorageTemplateCore(configRepository, config, storageRepository);
  }

  async handleTemplateMigrationSingle(data: IAssetJob) {
    const { asset } = data;

    try {
      const user = await this.userRepository.get(asset.ownerId);
      const storageLabel = user?.storageLabel || null;
      const filename = asset.originalFileName || asset.id;
      await this.moveAsset(asset, { storageLabel, filename });

      // move motion part of live photo
      if (asset.livePhotoVideoId) {
        const [livePhotoVideo] = await this.assetRepository.getByIds([asset.livePhotoVideoId]);
        const motionFilename = getLivePhotoMotionFilename(filename, livePhotoVideo.originalPath);
        await this.moveAsset(livePhotoVideo, { storageLabel, filename: motionFilename });
      }
    } catch (error: any) {
      this.logger.error('Error running single template migration', error);
    }
  }

  async handleTemplateMigration() {
    try {
      console.time('migrating-time');

      const assetPagination = usePagination(JOBS_ASSET_PAGINATION_SIZE, (pagination) =>
        this.assetRepository.getAll(pagination),
      );
      const users = await this.userRepository.getList();

      for await (const assets of assetPagination) {
        for (const asset of assets) {
          const user = users.find((user) => user.id === asset.ownerId);
          const storageLabel = user?.storageLabel || null;
          const filename = asset.originalFileName || asset.id;
          await this.moveAsset(asset, { storageLabel, filename });
        }
      }

      this.logger.debug('Cleaning up empty directories...');
      await this.storageRepository.removeEmptyDirs(APP_MEDIA_LOCATION);
    } catch (error: any) {
      this.logger.error('Error running template migration', error);
    } finally {
      console.timeEnd('migrating-time');
    }
  }

  // TODO: use asset core (once in domain)
  async moveAsset(asset: AssetEntity, metadata: MoveAssetMetadata) {
    const destination = await this.core.getTemplatePath(asset, metadata);
    if (asset.originalPath !== destination) {
      const source = asset.originalPath;

      let sidecarMoved = false;
      try {
        await this.storageRepository.moveFile(asset.originalPath, destination);

        let sidecarDestination;
        try {
          if (asset.sidecarPath) {
            sidecarDestination = `${destination}.xmp`;
            await this.storageRepository.moveFile(asset.sidecarPath, sidecarDestination);
            sidecarMoved = true;
          }

          await this.assetRepository.save({ id: asset.id, originalPath: destination, sidecarPath: sidecarDestination });
          asset.originalPath = destination;
          asset.sidecarPath = sidecarDestination || null;
        } catch (error: any) {
          this.logger.warn('Unable to save new originalPath to database, undoing move', error?.stack);

          // Either sidecar move failed or the save failed. Eithr way, move media back
          await this.storageRepository.moveFile(destination, source);

          if (asset.sidecarPath && sidecarDestination && sidecarMoved) {
            // If the sidecar was moved, that means the saved failed. So move both the sidecar and the
            // media back into their original positions
            await this.storageRepository.moveFile(sidecarDestination, asset.sidecarPath);
          }
        }
      } catch (error: any) {
        this.logger.error(`Problem applying storage template`, error?.stack, { id: asset.id, source, destination });
      }
    }
    return asset;
  }
}
