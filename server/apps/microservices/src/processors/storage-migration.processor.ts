import {
  APP_UPLOAD_LOCATION,
  IAssetRepository,
  INITIAL_SYSTEM_CONFIG,
  ISystemConfigRepository,
  JobName,
  QueueName,
  StorageCore,
} from '@app/domain';
import { AssetEntity, SystemConfig } from '@app/infra';
import { Process, Processor } from '@nestjs/bull';
import { Inject, Logger } from '@nestjs/common';
import { SystemConfigCore } from '@app/domain';

@Processor(QueueName.CONFIG)
export class StorageMigrationProcessor {
  readonly logger: Logger = new Logger(StorageMigrationProcessor.name);

  private storageCore: StorageCore;
  private configCore: SystemConfigCore;

  constructor(
    @Inject(ISystemConfigRepository) configRepository: ISystemConfigRepository,
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(INITIAL_SYSTEM_CONFIG) config: SystemConfig,
  ) {
    this.storageCore = new StorageCore(assetRepository, configRepository, config);
    this.configCore = new SystemConfigCore(configRepository);
  }

  /**
   * Migration process when a new user set a new storage template.
   * @param job
   */
  @Process({ name: JobName.TEMPLATE_MIGRATION, concurrency: 100 })
  async templateMigration() {
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
      const filename = asset.exifInfo?.imageName || livePhotoParentAsset?.exifInfo?.imageName || asset.id;
      await this.storageCore.moveAsset(asset, filename);
    }

    await this.storageCore.removeEmptyDirectories(APP_UPLOAD_LOCATION);
    console.timeEnd('migrating-time');
  }

  /**
   * Update config when a new storage template is set.
   * This is to ensure the synchronization between processes.
   * @param job
   */
  @Process({ name: JobName.CONFIG_CHANGE, concurrency: 1 })
  async updateTemplate() {
    await this.configCore.refreshConfig();
  }
}
