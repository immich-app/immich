import { AssetEntity } from '@app/database/entities/asset.entity';

export interface IAssetUploadedJob {
  /**
   * The Asset entity that was saved in the database
   */
  asset: AssetEntity;

  /**
   * Original file name
   */
  fileName: string;

  /**
   * File size in byte
   */
  fileSize: number;
}
