import { AssetEntity } from '@app/database/entities/asset.entity';

export interface StorageMigration {
  /**
   * The Asset entity that was saved in the database
   */
  asset: AssetEntity;

  /**
   * The filename that will be written at the destination path
   */
  filename: string;
}

export interface StorageTemplateUpdate {
  dummy: string;
}

export type IStorageMigrationJob = StorageMigration | StorageTemplateUpdate;
