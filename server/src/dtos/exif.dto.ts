import { createZodDto } from 'nestjs-zod';
import { Exif } from 'src/database';
import { MaybeDehydrated } from 'src/types';
import { asDateString } from 'src/utils/date';
import z from 'zod';

export const ExifResponseSchema = z
  .object({
    make: z.string().nullish().default(null).describe('Camera make'),
    model: z.string().nullish().default(null).describe('Camera model'),
    exifImageWidth: z.number().min(0).nullish().default(null).describe('Image width in pixels'),
    exifImageHeight: z.number().min(0).nullish().default(null).describe('Image height in pixels'),
    fileSizeInByte: z.int().min(0).nullish().default(null).describe('File size in bytes'),
    orientation: z.string().nullish().default(null).describe('Image orientation'),
    // TODO: use `isoDatetimeToDate` when using `ZodSerializerDto` on the controllers.
    dateTimeOriginal: z.string().meta({ format: 'date-time' }).nullish().default(null).describe('Original date/time'),
    // TODO: use `isoDatetimeToDate` when using `ZodSerializerDto` on the controllers.
    modifyDate: z.string().meta({ format: 'date-time' }).nullish().default(null).describe('Modification date/time'),
    timeZone: z.string().nullish().default(null).describe('Time zone'),
    lensModel: z.string().nullish().default(null).describe('Lens model'),
    fNumber: z.number().nullish().default(null).describe('F-number (aperture)'),
    focalLength: z.number().nullish().default(null).describe('Focal length in mm'),
    iso: z.number().nullish().default(null).describe('ISO sensitivity'),
    exposureTime: z.string().nullish().default(null).describe('Exposure time'),
    latitude: z.number().nullish().default(null).describe('GPS latitude'),
    longitude: z.number().nullish().default(null).describe('GPS longitude'),
    city: z.string().nullish().default(null).describe('City name'),
    state: z.string().nullish().default(null).describe('State/province name'),
    country: z.string().nullish().default(null).describe('Country name'),
    description: z.string().nullish().default(null).describe('Image description'),
    projectionType: z.string().nullish().default(null).describe('Projection type'),
    rating: z.number().nullish().default(null).describe('Rating'),
  })
  .describe('EXIF response')
  .meta({ id: 'ExifResponseDto' });

class ExifResponseDto extends createZodDto(ExifResponseSchema) {}

export function mapExif(entity: MaybeDehydrated<Exif>): ExifResponseDto {
  return {
    make: entity.make,
    model: entity.model,
    exifImageWidth: entity.exifImageWidth,
    exifImageHeight: entity.exifImageHeight,
    fileSizeInByte: entity.fileSizeInByte ? Number.parseInt(entity.fileSizeInByte.toString()) : null,
    orientation: entity.orientation,
    dateTimeOriginal: asDateString(entity.dateTimeOriginal),
    modifyDate: asDateString(entity.modifyDate),
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
