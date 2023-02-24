import { AssetEntity } from '@app/infra/db/entities';

export interface IVideoConversionProcessor {
  /**
   * The Asset entity that was saved in the database
   */
  asset: AssetEntity;
}

export type IVideoTranscodeJob = IVideoConversionProcessor;
