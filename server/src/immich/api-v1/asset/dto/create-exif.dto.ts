import { Optional } from '@app/domain';
import { IsNotEmpty } from 'class-validator';

export class CreateExifDto {
  @IsNotEmpty()
  assetId!: string;

  @Optional()
  make?: string;

  @Optional()
  model?: string;

  @Optional()
  exifImageWidth?: number;

  @Optional()
  exifImageHeight?: number;

  @Optional()
  fileSizeInByte?: number;

  @Optional()
  orientation?: string;

  @Optional()
  dateTimeOriginal?: Date;

  @Optional()
  modifiedDate?: Date;

  @Optional()
  lensModel?: string;

  @Optional()
  fNumber?: number;

  @Optional()
  focalLenght?: number;

  @Optional()
  iso?: number;

  @Optional()
  exposureTime?: number;
}
