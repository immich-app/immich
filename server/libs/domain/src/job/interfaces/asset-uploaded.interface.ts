import { AssetEntity } from '@app/infra/db/entities';

export interface IAssetUploadedJob {
  /**
   * The Asset entity that was saved in the database
   */
  asset: AssetEntity;

  /**
   * Original file name
   */
  fileName: string;
}
