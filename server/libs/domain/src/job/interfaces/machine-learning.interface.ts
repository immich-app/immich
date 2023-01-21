import { AssetEntity } from '@app/infra/db/entities';

export interface IMachineLearningJob {
  /**
   * The Asset entity that was saved in the database
   */
  asset: AssetEntity;
}
