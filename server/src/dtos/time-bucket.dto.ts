import { createZodDto } from 'nestjs-zod';
import { BBoxSchema } from 'src/dtos/bbox.dto';
import { AssetOrderSchema, AssetVisibilitySchema } from 'src/enum';
import { stringToBool } from 'src/validation';
import z from 'zod';

const TimeBucketQueryBaseSchema = z
  .object({
    userId: z.uuidv4().optional().describe('Filter assets by specific user ID'),
    albumId: z.uuidv4().optional().describe('Filter assets belonging to a specific album'),
    personId: z.uuidv4().optional().describe('Filter assets containing a specific person (face recognition)'),
    tagId: z.uuidv4().optional().describe('Filter assets with a specific tag'),
    isFavorite: stringToBool
      .optional()
      .describe('Filter by favorite status (true for favorites only, false for non-favorites only)'),
    isTrashed: stringToBool
      .optional()
      .describe('Filter by trash status (true for trashed assets only, false for non-trashed only)'),
    withStacked: stringToBool
      .optional()
      .describe('Include stacked assets in the response. When true, only primary assets from stacks are returned.'),
    withPartners: stringToBool.optional().describe('Include assets shared by partners'),
    order: AssetOrderSchema.optional().describe(
      'Sort order for assets within time buckets (ASC for oldest first, DESC for newest first)',
    ),
    visibility: AssetVisibilitySchema.optional().describe(
      'Filter by asset visibility status (ARCHIVE, TIMELINE, HIDDEN, LOCKED)',
    ),
    withCoordinates: stringToBool.optional().describe('Include location data in the response'),
    key: z.string().optional(),
    slug: z.string().optional(),
    bbox: z
      .string()
      .transform((value, ctx) => {
        const parts = value.split(',');
        if (parts.length !== 4) {
          ctx.issues.push({
            code: 'custom',
            message: 'bbox must have 4 comma-separated numbers: west,south,east,north',
            input: value,
          });
          return z.NEVER;
        }

        const [west, south, east, north] = parts.map(Number);
        if ([west, south, east, north].some((part) => Number.isNaN(part))) {
          ctx.issues.push({
            code: 'custom',
            message: 'bbox parts must be valid numbers',
            input: value,
          });
          return z.NEVER;
        }

        return { west, south, east, north };
      })
      .pipe(BBoxSchema)
      .optional()
      .describe('Bounding box coordinates as west,south,east,north (WGS84)')
      .meta({ example: '11.075683,49.416711,11.117589,49.454875' }),
  })
  .meta({ id: 'TimeBucketDto' });

const TimeBucketSchema = TimeBucketQueryBaseSchema;
const TimeBucketAssetSchema = TimeBucketQueryBaseSchema.extend({
  timeBucket: z.string().describe('Time bucket identifier in YYYY-MM-DD format').meta({ example: '2024-01-01' }),
}).meta({ id: 'TimeBucketAssetDto' });

const stackTupleSchema = z.array(z.string()).length(2).nullable();

const TimeBucketAssetResponseSchema = z
  .object({
    id: z.array(z.string()).describe('Array of asset IDs in the time bucket'),
    ownerId: z.array(z.string()).describe('Array of owner IDs for each asset'),
    ratio: z.array(z.number()).describe('Array of aspect ratios (width/height) for each asset'),
    isFavorite: z.array(z.boolean()).describe('Array indicating whether each asset is favorited'),
    visibility: z
      .array(AssetVisibilitySchema)
      .describe('Array of visibility statuses for each asset (e.g., ARCHIVE, TIMELINE, HIDDEN, LOCKED)'),
    isTrashed: z.array(z.boolean()).describe('Array indicating whether each asset is in the trash'),
    isImage: z.array(z.boolean()).describe('Array indicating whether each asset is an image (false for videos)'),
    thumbhash: z
      .array(z.string().nullable())
      .describe('Array of BlurHash strings for generating asset previews (base64 encoded)'),
    fileCreatedAt: z.array(z.string()).describe('Array of file creation timestamps in UTC'),
    localOffsetHours: z
      .array(z.number())
      .describe(
        "Array of UTC offset hours at the time each photo was taken. Positive values are east of UTC, negative values are west of UTC. Values may be fractional (e.g., 5.5 for +05:30, -9.75 for -09:45). Applying this offset to 'fileCreatedAt' will give you the time the photo was taken from the photographer's perspective.",
      ),
    duration: z.array(z.string().nullable()).describe('Array of video durations in HH:MM:SS format (null for images)'),
    stack: z
      .array(stackTupleSchema)
      .optional()
      .describe('Array of stack information as [stackId, assetCount] tuples (null for non-stacked assets)'),
    projectionType: z
      .array(z.string().nullable())
      .describe('Array of projection types for 360° content (e.g., "EQUIRECTANGULAR", "CUBEFACE", "CYLINDRICAL")'),
    livePhotoVideoId: z
      .array(z.string().nullable())
      .describe('Array of live photo video asset IDs (null for non-live photos)'),
    city: z.array(z.string().nullable()).describe('Array of city names extracted from EXIF GPS data'),
    country: z.array(z.string().nullable()).describe('Array of country names extracted from EXIF GPS data'),
    latitude: z
      .array(z.number().nullable())
      .optional()
      .describe('Array of latitude coordinates extracted from EXIF GPS data'),
    longitude: z
      .array(z.number().nullable())
      .optional()
      .describe('Array of longitude coordinates extracted from EXIF GPS data'),
  })
  .meta({ id: 'TimeBucketAssetResponseDto' });

const TimeBucketsResponseSchema = z
  .object({
    timeBucket: z
      .string()
      .describe('Time bucket identifier in YYYY-MM-DD format representing the start of the time period')
      .meta({ example: '2024-01-01' }),
    count: z.int().describe('Number of assets in this time bucket').meta({ example: 42 }),
  })
  .meta({ id: 'TimeBucketsResponseDto' });

export class TimeBucketDto extends createZodDto(TimeBucketSchema) {}
export class TimeBucketAssetDto extends createZodDto(TimeBucketAssetSchema) {}
export class TimeBucketAssetResponseDto extends createZodDto(TimeBucketAssetResponseSchema) {}
export class TimeBucketsResponseDto extends createZodDto(TimeBucketsResponseSchema) {}
