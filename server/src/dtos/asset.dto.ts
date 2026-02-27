import { createZodDto } from 'nestjs-zod';
import { HistoryBuilder } from 'src/decorators';
import { BulkIdsSchema } from 'src/dtos/asset-ids.response.dto';
import { AssetType, AssetVisibilitySchema } from 'src/enum';
import { AssetStats } from 'src/repositories/asset.repository';
import { IsNotSiblingOf, isoDatetimeToDate, latitudeSchema, longitudeSchema, stringToBool } from 'src/validation';
import z from 'zod';

const DeviceIdSchema = z
  .object({
    deviceId: z.string().describe('Device ID'),
  })
  .meta({ id: 'DeviceIdDto' });

const UpdateAssetBaseSchema = z
  .object({
    isFavorite: z.boolean().optional().describe('Mark as favorite'),
    visibility: AssetVisibilitySchema.optional(),
    dateTimeOriginal: z.string().optional().describe('Original date and time'),
    latitude: latitudeSchema.optional().describe('Latitude coordinate'),
    longitude: longitudeSchema.optional().describe('Longitude coordinate'),
    rating: z
      .number()
      .int()
      .min(-1)
      .max(5)
      .transform((value) => (value === 0 ? null : value))
      .nullish()
      .describe('Rating in range [1-5], or null for unrated')
      .meta({
        ...new HistoryBuilder()
          .added('v1')
          .stable('v2')
          .updated('v2.6.0', 'Using -1 as a rating is deprecated and will be removed in the next major version.')
          .getExtensions(),
      }),
    description: z.string().optional().describe('Asset description'),
  })
  .refine(
    (data) =>
      (data.latitude === undefined && data.longitude === undefined) ||
      (data.latitude !== undefined && data.longitude !== undefined),
    { message: 'Latitude and longitude must be provided together' },
  );

const AssetBulkUpdateBaseSchema = UpdateAssetBaseSchema.extend({
  ids: z.array(z.uuidv4()).describe('Asset IDs to update'),
  duplicateId: z.string().nullish().describe('Duplicate ID'),
  dateTimeRelative: z.number().optional().describe('Relative time offset in seconds'),
  timeZone: z.string().optional().describe('Time zone (IANA timezone)'),
});

const AssetBulkUpdateSchema = AssetBulkUpdateBaseSchema.pipe(
  IsNotSiblingOf(AssetBulkUpdateBaseSchema, 'dateTimeRelative', ['dateTimeOriginal']),
).meta({ id: 'AssetBulkUpdateDto' });

const UpdateAssetSchema = UpdateAssetBaseSchema.extend({
  livePhotoVideoId: z.uuidv4().nullish().describe('Live photo video ID'),
}).meta({ id: 'UpdateAssetDto' });

const RandomAssetsSchema = z
  .object({
    count: z.coerce.number().min(1).optional().describe('Number of random assets to return'),
  })
  .meta({ id: 'RandomAssetsDto' });

const AssetBulkDeleteSchema = BulkIdsSchema.extend({
  force: z.boolean().optional().describe('Force delete even if in use'),
}).meta({ id: 'AssetBulkDeleteDto' });

export const AssetIdsSchema = z
  .object({
    assetIds: z.array(z.uuidv4()).describe('Asset IDs'),
  })
  .meta({ id: 'AssetIdsDto' });

export enum AssetJobName {
  REFRESH_FACES = 'refresh-faces',
  REFRESH_METADATA = 'refresh-metadata',
  REGENERATE_THUMBNAIL = 'regenerate-thumbnail',
  TRANSCODE_VIDEO = 'transcode-video',
}

const AssetJobNameSchema = z.enum(AssetJobName).describe('Job name').meta({ id: 'AssetJobName' });

const AssetJobsSchema = AssetIdsSchema.extend({
  name: AssetJobNameSchema,
}).meta({ id: 'AssetJobsDto' });

const AssetStatsSchema = z
  .object({
    visibility: AssetVisibilitySchema.optional(),
    isFavorite: stringToBool.optional().describe('Filter by favorite status'),
    isTrashed: stringToBool.optional().describe('Filter by trash status'),
  })
  .meta({ id: 'AssetStatsDto' });

const AssetStatsResponseSchema = z
  .object({
    images: z.int().describe('Number of images'),
    videos: z.int().describe('Number of videos'),
    total: z.int().describe('Total number of assets'),
  })
  .meta({ id: 'AssetStatsResponseDto' });

const AssetMetadataRouteParamsSchema = z
  .object({
    id: z.uuidv4().describe('Asset ID'),
    key: z.string().describe('Metadata key'),
  })
  .meta({ id: 'AssetMetadataRouteParams' });

export const AssetMetadataUpsertItemSchema = z
  .object({
    key: z.string().describe('Metadata key'),
    value: z.record(z.string(), z.unknown()).describe('Metadata value (object)'),
  })
  .meta({ id: 'AssetMetadataUpsertItemDto' });

const AssetMetadataUpsertSchema = z
  .object({
    items: z.array(AssetMetadataUpsertItemSchema).describe('Metadata items to upsert'),
  })
  .meta({ id: 'AssetMetadataUpsertDto' });

const AssetMetadataBulkUpsertItemSchema = z
  .object({
    assetId: z.uuidv4().describe('Asset ID'),
    key: z.string().describe('Metadata key'),
    value: z.record(z.string(), z.unknown()).describe('Metadata value (object)'),
  })
  .meta({ id: 'AssetMetadataBulkUpsertItemDto' });

const AssetMetadataBulkUpsertSchema = z
  .object({
    items: z.array(AssetMetadataBulkUpsertItemSchema).describe('Metadata items to upsert'),
  })
  .meta({ id: 'AssetMetadataBulkUpsertDto' });

const AssetMetadataBulkDeleteItemSchema = z
  .object({
    assetId: z.uuidv4().describe('Asset ID'),
    key: z.string().describe('Metadata key'),
  })
  .meta({ id: 'AssetMetadataBulkDeleteItemDto' });

const AssetMetadataBulkDeleteSchema = z
  .object({
    items: z.array(AssetMetadataBulkDeleteItemSchema).describe('Metadata items to delete'),
  })
  .meta({ id: 'AssetMetadataBulkDeleteDto' });

const AssetMetadataResponseSchema = z
  .object({
    key: z.string().describe('Metadata key'),
    value: z.record(z.string(), z.unknown()).describe('Metadata value (object)'),
    updatedAt: isoDatetimeToDate.describe('Last update date'),
  })
  .meta({ id: 'AssetMetadataResponseDto' });

const AssetMetadataBulkResponseSchema = AssetMetadataResponseSchema.extend({
  assetId: z.string().describe('Asset ID'),
}).meta({ id: 'AssetMetadataBulkResponseDto' });

const AssetCopySchema = z
  .object({
    sourceId: z.uuidv4().describe('Source asset ID'),
    targetId: z.uuidv4().describe('Target asset ID'),
    sharedLinks: z.boolean().default(true).optional().describe('Copy shared links'),
    albums: z.boolean().default(true).optional().describe('Copy album associations'),
    sidecar: z.boolean().default(true).optional().describe('Copy sidecar file'),
    stack: z.boolean().default(true).optional().describe('Copy stack association'),
    favorite: z.boolean().default(true).optional().describe('Copy favorite status'),
  })
  .meta({ id: 'AssetCopyDto' });

const AssetDownloadOriginalSchema = z
  .object({
    edited: stringToBool.default(false).optional().describe('Return edited asset if available'),
  })
  .meta({ id: 'AssetDownloadOriginalDto' });

export const mapStats = (stats: AssetStats): AssetStatsResponseDto => {
  return {
    images: stats[AssetType.Image],
    videos: stats[AssetType.Video],
    total: Object.values(stats).reduce((total, value) => total + value, 0),
  };
};

export class DeviceIdDto extends createZodDto(DeviceIdSchema) {}
export class AssetBulkUpdateDto extends createZodDto(AssetBulkUpdateSchema) {}
export class UpdateAssetDto extends createZodDto(UpdateAssetSchema) {}
export class RandomAssetsDto extends createZodDto(RandomAssetsSchema) {}
export class AssetBulkDeleteDto extends createZodDto(AssetBulkDeleteSchema) {}
export class AssetIdsDto extends createZodDto(AssetIdsSchema) {}
export class AssetJobsDto extends createZodDto(AssetJobsSchema) {}
export class AssetStatsDto extends createZodDto(AssetStatsSchema) {}
export class AssetStatsResponseDto extends createZodDto(AssetStatsResponseSchema) {}
export class AssetMetadataRouteParams extends createZodDto(AssetMetadataRouteParamsSchema) {}
export class AssetMetadataUpsertDto extends createZodDto(AssetMetadataUpsertSchema) {}
export class AssetMetadataBulkUpsertDto extends createZodDto(AssetMetadataBulkUpsertSchema) {}
export class AssetMetadataBulkDeleteDto extends createZodDto(AssetMetadataBulkDeleteSchema) {}
export class AssetMetadataResponseDto extends createZodDto(AssetMetadataResponseSchema) {}
export class AssetMetadataBulkResponseDto extends createZodDto(AssetMetadataBulkResponseSchema) {}
export class AssetCopyDto extends createZodDto(AssetCopySchema) {}
export class AssetDownloadOriginalDto extends createZodDto(AssetDownloadOriginalSchema) {}
