import { AssetEntity } from '@app/infra/db/entities';

export interface IExifExtractionProcessor {
  /**
   * The Asset entity that was saved in the database
   */
  asset: AssetEntity;

  /**
   * Original file name
   */
  fileName: string;
}

export interface IVideoLengthExtractionProcessor {
  /**
   * The Asset entity that was saved in the database
   */
  asset: AssetEntity;

  /**
   * Original file name
   */
  fileName: string;
}

export interface IReverseGeocodingProcessor {
  exifId: string;
  latitude: number;
  longitude: number;
}

export type IMetadataExtractionJob =
  | IExifExtractionProcessor
  | IVideoLengthExtractionProcessor
  | IReverseGeocodingProcessor;
