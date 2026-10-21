import { createZodDto } from 'nestjs-zod';
import z from 'zod';
import { latitudeSchema, longitudeSchema } from 'src/validation.js';

const FavoriteLocationNameSchema = z.string().trim().min(1).max(100).describe('Name of the favorite location');

const FavoriteLocationCreateSchema = z
  .object({
    name: FavoriteLocationNameSchema,
    latitude: latitudeSchema.describe('Latitude (-90 to 90)'),
    longitude: longitudeSchema.describe('Longitude (-180 to 180)'),
  })
  .meta({ id: 'FavoriteLocationCreateDto' });

const FavoriteLocationResponseSchema = z
  .object({
    id: z.uuidv4().describe('Favorite location ID'),
    name: FavoriteLocationNameSchema,
    latitude: latitudeSchema.describe('Latitude (-90 to 90)'),
    longitude: longitudeSchema.describe('Longitude (-180 to 180)'),
  })
  .meta({ id: 'FavoriteLocationResponseDto' });

export class FavoriteLocationCreateDto extends createZodDto(FavoriteLocationCreateSchema) {}
export class FavoriteLocationResponseDto extends createZodDto(FavoriteLocationResponseSchema) {}
