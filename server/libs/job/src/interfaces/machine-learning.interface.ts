import { AssetEntity } from '@app/infra';

export interface IMachineLearningJob {
  /**
   * The Asset entity that was saved in the database
   */
  asset: AssetEntity;
}
