import { createZodDto } from 'nestjs-zod';
import { PersonResponseSchema } from 'src/dtos/person.dto';
import z from 'zod';

const MonthlyStatSchema = z
  .object({
    year: z.number().int().describe('Year (YYYY)'),
    month: z.number().int().min(1).max(12).describe('Month (1-12)'),
    count: z.number().int().min(0).describe('Number of assets taken in this month'),
  })
  .meta({ id: 'MonthlyStatDto' });

const TemporalStatSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6).describe('Day of week (0=Sunday, 6=Saturday)'),
    hour: z.number().int().min(0).max(23).describe('Hour of day (0-23)'),
    count: z.number().int().min(0).describe('Number of assets taken in this hour on this day'),
  })
  .meta({ id: 'TemporalStatDto' });

const PersonStatSchema = PersonResponseSchema.extend({
  count: z.number().int().min(0).describe('Number of assets containing this person'),
}).meta({ id: 'PersonStatDto' });

const CameraStatSchema = z
  .object({
    make: z.string().nullable().describe('Camera manufacturer/make'),
    model: z.string().nullable().describe('Camera model'),
    count: z.number().int().min(0).describe('Number of assets taken with this camera'),
  })
  .meta({ id: 'CameraStatDto' });

const LensStatSchema = z
  .object({
    lensModel: z.string().nullable().describe('Lens model'),
    count: z.number().int().min(0).describe('Number of assets taken with this lens'),
  })
  .meta({ id: 'LensStatDto' });

const CityStatSchema = z
  .object({
    city: z.string().nullable().describe('City name'),
    count: z.number().int().min(0).describe('Number of assets taken in this city'),
  })
  .meta({ id: 'CityStatDto' });

const CountryStatSchema = z
  .object({
    country: z.string().nullable().describe('Country name'),
    count: z.number().int().min(0).describe('Number of assets taken in this country'),
  })
  .meta({ id: 'CountryStatDto' });

const StorageStatSchema = z
  .object({
    type: z.enum(['IMAGE', 'VIDEO']).describe('Asset type'),
    size: z.number().int().min(0).describe('Total size in bytes'),
    count: z.number().int().min(0).describe('Number of assets of this type'),
  })
  .meta({ id: 'StorageStatDto' });

const StatisticsResponseSchema = z
  .object({
    monthly: z.array(MonthlyStatSchema).describe('Monthly asset counts'),
    temporalMatrix: z.array(TemporalStatSchema).describe('Asset counts by weekday and hour'),
    topPeople: z.array(PersonStatSchema).describe('Top people by asset count'),
    topCameras: z.array(CameraStatSchema).describe('Top most used cameras'),
    topLenses: z.array(LensStatSchema).describe('Top most used lenses'),
    topCities: z.array(CityStatSchema).describe('Top most used cities'),
    topCountries: z.array(CountryStatSchema).describe('Top most used countries'),
    storage: z.array(StorageStatSchema).describe('Storage breakdown by type (IMAGE/VIDEO)'),
    total: z
      .object({
        photos: z.number().int().min(0),
        videos: z.number().int().min(0),
        storage: z.number().int().min(0),
      })
      .describe('Aggregate totals'),
  })
  .meta({ id: 'StatisticsResponseDto' });

export class MonthlyStatDto extends createZodDto(MonthlyStatSchema) {}
export class TemporalStatDto extends createZodDto(TemporalStatSchema) {}
export class PersonStatDto extends createZodDto(PersonStatSchema) {}
export class CameraStatDto extends createZodDto(CameraStatSchema) {}
export class LensStatDto extends createZodDto(LensStatSchema) {}
export class CityStatDto extends createZodDto(CityStatSchema) {}
export class CountryStatDto extends createZodDto(CountryStatSchema) {}
export class StorageStatDto extends createZodDto(StorageStatSchema) {}
export class StatisticsResponseDto extends createZodDto(StatisticsResponseSchema) {}
