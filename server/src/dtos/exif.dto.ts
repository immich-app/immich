import { createZodDto } from 'nestjs-zod';
import { Exif } from 'src/database';
import { z } from 'zod';

export const ExifResponseSchema = z
  .object({
    make: z.string().describe('Camera make').nullish(),
    model: z.string().describe('Camera model').nullish(),
    exifImageWidth: z.int().nonnegative().describe('Image width in pixels').nullish(),
    exifImageHeight: z.int().nonnegative().describe('Image height in pixels').nullish(),
    fileSizeInByte: z.int().nonnegative().describe('File size in bytes').nullish(),
    orientation: z.string().describe('Image orientation').nullish(),
    dateTimeOriginal: z.iso.datetime().describe('Original date/time').nullish(),
    modifyDate: z.iso.datetime().describe('Modification date/time').nullish(),
    timeZone: z.string().describe('Time zone').nullish(),
    lensModel: z.string().describe('Lens model').nullish(),
    fNumber: z.number().describe('F-number (aperture)').nullish(),
    focalLength: z.number().describe('Focal length in mm').nullish(),
    iso: z.number().describe('ISO sensitivity').nullish(),
    exposureTime: z.string().describe('Exposure time').nullish(),
    latitude: z.number().describe('GPS latitude').nullish(),
    longitude: z.number().describe('GPS longitude').nullish(),
    city: z.string().describe('City name').nullish(),
    state: z.string().describe('State/province name').nullish(),
    country: z.string().describe('Country name').nullish(),
    description: z.string().describe('Image description').nullish(),
    projectionType: z.string().describe('Projection type').nullish(),
    rating: z.number().describe('Rating').nullish(),
  })
  .describe('EXIF response')
  .meta({ id: 'ExifResponseDto' });

export class ExifResponseDto extends createZodDto(ExifResponseSchema) {}

export function mapExif(entity: Exif): ExifResponseDto {
  return {
    make: entity.make,
    model: entity.model,
    exifImageWidth: entity.exifImageWidth,
    exifImageHeight: entity.exifImageHeight,
    fileSizeInByte: entity.fileSizeInByte ? Number.parseInt(entity.fileSizeInByte.toString()) : null,
    orientation: entity.orientation,
    dateTimeOriginal: entity.dateTimeOriginal != null ? new Date(entity.dateTimeOriginal).toISOString() : null,
    modifyDate: entity.modifyDate != null ? new Date(entity.modifyDate).toISOString() : null,
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
    dateTimeOriginal: entity.dateTimeOriginal != null ? new Date(entity.dateTimeOriginal).toISOString() : null,
    timeZone: entity.timeZone,
    projectionType: entity.projectionType,
    exifImageWidth: entity.exifImageWidth,
    exifImageHeight: entity.exifImageHeight,
    rating: entity.rating,
  };
}
