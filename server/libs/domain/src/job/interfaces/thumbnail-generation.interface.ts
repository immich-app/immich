import { AssetEntity } from '@app/infra/db/entities';

export interface JpegGeneratorProcessor {
  /**
   * The Asset entity that was saved in the database
   */
  asset: AssetEntity;
}

export interface WebpGeneratorProcessor {
  /**
   * The Asset entity that was saved in the database
   */
  asset: AssetEntity;
}

export type IThumbnailGenerationJob = JpegGeneratorProcessor | WebpGeneratorProcessor;
