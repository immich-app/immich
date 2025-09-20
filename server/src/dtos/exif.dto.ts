import { ApiPropertyOptional } from '@nestjs/swagger';
import { Exif } from 'src/database';

export class ExifResponseDto {
  make?: string | null = null;
  model?: string | null = null;
  @ApiPropertyOptional({ type: 'integer' })
  exifImageWidth?: number | null = null;
  @ApiPropertyOptional({ type: 'integer' })
  exifImageHeight?: number | null = null;
  @ApiPropertyOptional({ type: 'integer', format: 'int64' })
  fileSizeInByte?: number | null = null;
  orientation?: string | null = null;
  dateTimeOriginal?: Date | null = null;
  modifyDate?: Date | null = null;
  timeZone?: string | null = null;
  lensModel?: string | null = null;
  @ApiPropertyOptional({ type: 'number', format: 'double' })
  fNumber?: number | null = null;
  @ApiPropertyOptional({ type: 'number', format: 'double' })
  focalLength?: number | null = null;
  @ApiPropertyOptional({ type: 'integer' })
  iso?: number | null = null;
  exposureTime?: string | null = null;
  @ApiPropertyOptional({ type: 'number', format: 'double' })
  latitude?: number | null = null;
  @ApiPropertyOptional({ type: 'number', format: 'double' })
  longitude?: number | null = null;
  city?: string | null = null;
  state?: string | null = null;
  country?: string | null = null;
  description?: string | null = null;
  projectionType?: string | null = null;
  @ApiPropertyOptional({ type: 'integer' })
  rating?: number | null = null;
}

export function mapExif(entity: Exif): ExifResponseDto {
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
    rating: entity.rating,
  };
}

export function mapSanitizedExif(entity: Exif): ExifResponseDto {
  return {
    fileSizeInByte: entity.fileSizeInByte ? Number.parseInt(entity.fileSizeInByte.toString()) : null,
    orientation: entity.orientation,
    dateTimeOriginal: entity.dateTimeOriginal,
    timeZone: entity.timeZone,
    projectionType: entity.projectionType,
    exifImageWidth: entity.exifImageWidth,
    exifImageHeight: entity.exifImageHeight,
    rating: entity.rating,
  };
}
