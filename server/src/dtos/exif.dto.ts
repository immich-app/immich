import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exif } from 'src/database';

export class ExifResponseDto {
  @ApiPropertyOptional({ description: 'Camera make' })
  make?: string | null = null;
  @ApiPropertyOptional({ description: 'Camera model' })
  model?: string | null = null;
  @ApiPropertyOptional({ type: 'number', description: 'Image width in pixels' })
  exifImageWidth?: number | null = null;
  @ApiPropertyOptional({ type: 'number', description: 'Image height in pixels' })
  exifImageHeight?: number | null = null;

  @ApiProperty({ type: 'integer', format: 'int64', description: 'File size in bytes' })
  fileSizeInByte?: number | null = null;
  @ApiPropertyOptional({ description: 'Image orientation' })
  orientation?: string | null = null;
  @ApiPropertyOptional({ description: 'Original date/time', format: 'date-time' })
  dateTimeOriginal?: Date | null = null;
  @ApiPropertyOptional({ description: 'Modification date/time', format: 'date-time' })
  modifyDate?: Date | null = null;
  @ApiPropertyOptional({ description: 'Time zone' })
  timeZone?: string | null = null;
  @ApiPropertyOptional({ description: 'Lens model' })
  lensModel?: string | null = null;
  @ApiPropertyOptional({ type: 'number', description: 'F-number (aperture)' })
  fNumber?: number | null = null;
  @ApiPropertyOptional({ type: 'number', description: 'Focal length in mm' })
  focalLength?: number | null = null;
  @ApiPropertyOptional({ type: 'number', description: 'ISO sensitivity' })
  iso?: number | null = null;
  @ApiPropertyOptional({ description: 'Exposure time' })
  exposureTime?: string | null = null;
  @ApiPropertyOptional({ type: 'number', description: 'GPS latitude' })
  latitude?: number | null = null;
  @ApiPropertyOptional({ type: 'number', description: 'GPS longitude' })
  longitude?: number | null = null;
  @ApiPropertyOptional({ description: 'City name' })
  city?: string | null = null;
  @ApiPropertyOptional({ description: 'State/province name' })
  state?: string | null = null;
  @ApiPropertyOptional({ description: 'Country name' })
  country?: string | null = null;
  @ApiPropertyOptional({ description: 'Image description' })
  description?: string | null = null;
  @ApiPropertyOptional({ description: 'Projection type' })
  projectionType?: string | null = null;
  @ApiPropertyOptional({ type: 'number', description: 'Rating' })
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
