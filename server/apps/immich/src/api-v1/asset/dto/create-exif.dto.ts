import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateExifDto {
  @IsNotEmpty()
  assetId!: string;

  @IsOptional()
  make?: string;

  @IsOptional()
  model?: string;

  @IsOptional()
  exifImageWidth?: number;

  @IsOptional()
  exifImageHeight?: number;

  @IsOptional()
  fileSizeInByte?: number;

  @IsOptional()
  orientation?: string;

  @IsOptional()
  dateTimeOriginal?: Date;

  @IsOptional()
  modifiedDate?: Date;

  @IsOptional()
  lensModel?: string;

  @IsOptional()
  fNumber?: number;

  @IsOptional()
  focalLenght?: number;

  @IsOptional()
  iso?: number;

  @IsOptional()
  exposureTime?: number;
}
