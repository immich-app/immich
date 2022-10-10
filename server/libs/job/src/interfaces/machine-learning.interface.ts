import { AssetEntity } from '@app/database/entities/asset.entity';

export interface IMachineLearningJob {
  /**
   * The Asset entity that was saved in the database
   */
  asset: AssetEntity;
}
