import { AssetEntity } from '@app/database/entities/asset.entity';
import { ExifEntity } from '@app/database/entities/exif.entity';

export interface IExifExtractionProcessor {
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

export interface IVideoLengthExtractionProcessor {
  /**
   * The Asset entity that was saved in the database
   */
  asset: AssetEntity;
}

export interface IReverseGeocodingProcessor {
  /**
   * The Asset entity that was saved in the database
   */
  exif: ExifEntity;
}

export type IMetadataExtractionJob =
  | IExifExtractionProcessor
  | IVideoLengthExtractionProcessor
  | IReverseGeocodingProcessor;
