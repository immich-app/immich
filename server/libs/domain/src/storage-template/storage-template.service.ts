import { AssetEntity, SystemConfig } from '@app/infra/entities';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { IAssetRepository } from '../asset/asset.repository';
import { APP_MEDIA_LOCATION } from '../domain.constant';
import { getLivePhotoMotionFilename } from '../domain.util';
import { IAssetJob } from '../job';
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

  async handleTemplateMigrationSingle(data: IAssetJob) {
    const { asset } = data;

    try {
      const filename = asset.originalFileName || asset.id;
      await this.moveAsset(asset, filename);

      // move motion part of live photo
      if (asset.livePhotoVideoId) {
        const [livePhotoVideo] = await this.assetRepository.getByIds([asset.livePhotoVideoId]);
        const motionFilename = getLivePhotoMotionFilename(filename, livePhotoVideo.originalPath);
        await this.moveAsset(livePhotoVideo, motionFilename);
      }
    } catch (error: any) {
      this.logger.error('Error running single template migration', error);
    }
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
        const filename = asset.originalFileName || livePhotoParentAsset?.originalFileName || asset.id;
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

      let sidecarMoved = false
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
