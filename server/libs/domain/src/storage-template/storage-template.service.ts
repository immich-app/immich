import { AssetEntity, SystemConfig } from '@app/infra/db/entities';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { IAssetRepository } from '../asset/asset.repository';
import { APP_MEDIA_LOCATION } from '../domain.constant';
import { IStorageRepository } from '../storage/storage.repository';
import { INITIAL_SYSTEM_CONFIG, ISystemConfigRepository } from '../system-config';
import { StorageTemplateCore } from './storage-template.core';

@Injectable()
export class StorageTemplateService {
  private logger = new Logger(StorageTemplateService.name);
  private core: StorageTemplateCore;

  constructor(
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(ISystemConfigRepository) configRepository: ISystemConfigRepository,
    @Inject(INITIAL_SYSTEM_CONFIG) config: SystemConfig,
    @Inject(IStorageRepository) private storageRepository: IStorageRepository,
  ) {
    this.core = new StorageTemplateCore(configRepository, config, storageRepository);
  }

  async handleTemplateMigration() {
    try {
      console.time('migrating-time');
      const assets = await this.assetRepository.getAll();

      const livePhotoMap: Record<string, AssetEntity> = {};

      for (const asset of assets) {
        if (asset.livePhotoVideoId) {
          livePhotoMap[asset.livePhotoVideoId] = asset;
        }
      }

      for (const asset of assets) {
        const livePhotoParentAsset = livePhotoMap[asset.id];
        // TODO: remove livePhoto specific stuff once upload is fixed
        const filename = asset.exifInfo?.imageName || livePhotoParentAsset?.exifInfo?.imageName || asset.id;
        await this.moveAsset(asset, filename);
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
  async moveAsset(asset: AssetEntity, originalName: string) {
    const destination = await this.core.getTemplatePath(asset, originalName);
    if (asset.originalPath !== destination) {
      const source = asset.originalPath;

      try {
        await this.storageRepository.moveFile(asset.originalPath, destination);
        try {
          await this.assetRepository.save({ id: asset.id, originalPath: destination });
          asset.originalPath = destination;
        } catch (error: any) {
          this.logger.warn('Unable to save new originalPath to database, undoing move', error?.stack);
          await this.storageRepository.moveFile(destination, source);
        }
      } catch (error: any) {
        this.logger.error(`Problem applying storage template`, error?.stack, { id: asset.id, source, destination });
      }
    }
    return asset;
  }
}
