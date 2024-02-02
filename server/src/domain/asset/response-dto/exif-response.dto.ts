import { ExifEntity } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';

export class ExifResponseDto {
  make?: string | null = null;
  model?: string | null = null;
  exifImageWidth?: number | null = null;
  exifImageHeight?: number | null = null;

  @ApiProperty({ type: 'integer', format: 'int64' })
  fileSizeInByte?: number | null = null;
  orientation?: string | null = null;
  dateTimeOriginal?: Date | null = null;
  modifyDate?: Date | null = null;
  timeZone?: string | null = null;
  lensModel?: string | null = null;
  fNumber?: number | null = null;
  focalLength?: number | null = null;
  iso?: number | null = null;
  exposureTime?: string | null = null;
  latitude?: number | null = null;
  longitude?: number | null = null;
  city?: string | null = null;
  state?: string | null = null;
  country?: string | null = null;
  description?: string | null = null;
  projectionType?: string | null = null;
}

export function mapExif(entity: ExifEntity): ExifResponseDto {
  return {
    make: entity.make,
    model: entity.model,
    exifImageWidth: entity.exifImageWidth,
    exifImageHeight: entity.exifImageHeight,
    fileSizeInByte: entity.fileSizeInByte ? Number.parseInt(entity.fileSizeInByte.toString()) : null,
    orientation: entity.orientation,
    dateTimeOriginal: entity.dateTimeOriginal,
    modifyDate: entity.modifyDate,
    timeZone: entity.timeZone,
    lensModel: entity.lensModel,
    fNumber: entity.fNumber,
    focalLength: entity.focalLength,
    iso: entity.iso,
    exposureTime: entity.exposureTime,
    latitude: entity.latitude,
    longitude: entity.longitude,
    city: entity.city,
    state: entity.state,
    country: entity.country,
    description: entity.description,
    projectionType: entity.projectionType,
  };
}

export function mapSanitizedExif(entity: ExifEntity): ExifResponseDto {
  return {
    fileSizeInByte: entity.fileSizeInByte ? Number.parseInt(entity.fileSizeInByte.toString()) : null,
    orientation: entity.orientation,
    dateTimeOriginal: entity.dateTimeOriginal,
    timeZone: entity.timeZone,
    projectionType: entity.projectionType,
    exifImageWidth: entity.exifImageWidth,
    exifImageHeight: entity.exifImageHeight,
  };
}
