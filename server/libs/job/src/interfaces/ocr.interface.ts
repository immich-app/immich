import { AssetEntity } from '@app/database/entities/asset.entity';

export interface IOcrJob {
  /**
   * The Asset entity that was saved in the database
   */
  asset: AssetEntity;
}
