import { createZodDto } from '@immich/nestjs-standard-schema/zod';
import z from 'zod';
import { isoDatetimeToDate, latitudeSchema, longitudeSchema, stringToBool } from 'src/validation.js';

export class MapReverseGeocodeDto extends createZodDto({
  lat: z.coerce.number().meta({ format: 'double' }).pipe(latitudeSchema).describe('Latitude (-90 to 90)'),
  lon: z.coerce.number().meta({ format: 'double' }).pipe(longitudeSchema).describe('Longitude (-180 to 180)'),
}) {}

export class MapReverseGeocodeResponseDto extends createZodDto({
  city: z.string().nullable().describe('City name'),
  state: z.string().nullable().describe('State/Province name'),
  country: z.string().nullable().describe('Country name'),
}) {}

export class MapMarkerDto extends createZodDto({
  isArchived: stringToBool.optional().describe('Filter by archived status'),
  isFavorite: stringToBool.optional().describe('Filter by favorite status'),
  fileCreatedAfter: isoDatetimeToDate.optional().describe('Filter assets created after this date'),
  fileCreatedBefore: isoDatetimeToDate.optional().describe('Filter assets created before this date'),
  withPartners: stringToBool.optional().describe('Include partner assets'),
  withSharedAlbums: stringToBool.optional().describe('Include shared album assets'),
}) {}

export class MapMarkerResponseDto extends createZodDto({
  id: z.uuidv4().describe('Asset ID'),
  lat: z.number().meta({ format: 'double' }).describe('Latitude'),
  lon: z.number().meta({ format: 'double' }).describe('Longitude'),
  city: z.string().nullable().describe('City name'),
  state: z.string().nullable().describe('State/Province name'),
  country: z.string().nullable().describe('Country name'),
}) {}
