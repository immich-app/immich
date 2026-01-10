import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { Exif } from 'src/database';

@ApiSchema({ description: 'EXIF metadata response with camera details' })
export class ExifResponseDto {
  @ApiPropertyOptional({ description: 'Camera make', nullable: true })
  make?: string | null = null;
  @ApiPropertyOptional({ description: 'Camera model', nullable: true })
  model?: string | null = null;
  @ApiPropertyOptional({ type: 'number', description: 'Image width in pixels', nullable: true })
  exifImageWidth?: number | null = null;
  @ApiPropertyOptional({ type: 'number', description: 'Image height in pixels', nullable: true })
  exifImageHeight?: number | null = null;

  @ApiProperty({ type: 'integer', format: 'int64', description: 'File size in bytes', nullable: true })
  fileSizeInByte?: number | null = null;
  @ApiPropertyOptional({ description: 'Image orientation', nullable: true })
  orientation?: string | null = null;
  @ApiPropertyOptional({ description: 'Original date/time', format: 'date-time', nullable: true })
  dateTimeOriginal?: Date | null = null;
  @ApiPropertyOptional({ description: 'Modification date/time', format: 'date-time', nullable: true })
  modifyDate?: Date | null = null;
  @ApiPropertyOptional({ description: 'Time zone', nullable: true })
  timeZone?: string | null = null;
  @ApiPropertyOptional({ description: 'Lens model', nullable: true })
  lensModel?: string | null = null;
  @ApiPropertyOptional({ type: 'number', description: 'F-number (aperture)', nullable: true })
  fNumber?: number | null = null;
  @ApiPropertyOptional({ type: 'number', description: 'Focal length in mm', nullable: true })
  focalLength?: number | null = null;
  @ApiPropertyOptional({ type: 'number', description: 'ISO sensitivity', nullable: true })
  iso?: number | null = null;
  @ApiPropertyOptional({ description: 'Exposure time', nullable: true })
  exposureTime?: string | null = null;
  @ApiPropertyOptional({ type: 'number', description: 'GPS latitude', nullable: true })
  latitude?: number | null = null;
  @ApiPropertyOptional({ type: 'number', description: 'GPS longitude', nullable: true })
  longitude?: number | null = null;
  @ApiPropertyOptional({ description: 'City name', nullable: true })
  city?: string | null = null;
  @ApiPropertyOptional({ description: 'State/province name', nullable: true })
  state?: string | null = null;
  @ApiPropertyOptional({ description: 'Country name', nullable: true })
  country?: string | null = null;
  @ApiPropertyOptional({ description: 'Image description', nullable: true })
  description?: string | null = null;
  @ApiPropertyOptional({ description: 'Projection type', nullable: true })
  projectionType?: string | null = null;
  @ApiPropertyOptional({ type: 'number', description: 'Rating (-1 to 5)', nullable: true })
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
