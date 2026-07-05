import { latitudeSchema, longitudeSchema } from 'src/validation';
import z from 'zod';

export const BBoxSchema = z
  .object({
    west: longitudeSchema.describe('West longitude (-180 to 180)'),
    south: latitudeSchema.describe('South latitude (-90 to 90)'),
    east: longitudeSchema.describe(
      'East longitude (-180 to 180). May be less than west when crossing the antimeridian.',
    ),
    north: latitudeSchema.describe('North latitude (-90 to 90). Must be >= south.'),
  })
  .refine(({ north, south }) => north >= south, {
    path: ['north'],
    error: 'North latitude must be greater than or equal to south latitude',
  })
  .meta({ id: 'BBoxDto' });
