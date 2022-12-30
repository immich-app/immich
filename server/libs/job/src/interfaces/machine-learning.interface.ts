import { AssetEntity } from '@app/database';

export interface IMachineLearningJob {
  /**
   * The Asset entity that was saved in the database
   */
  asset: AssetEntity;
}
