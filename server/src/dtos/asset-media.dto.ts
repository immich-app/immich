import { createZodDto } from 'nestjs-zod';
import { AssetMetadataUpsertItemSchema } from 'src/dtos/asset.dto';
import { AssetVisibilitySchema } from 'src/enum';
import { isoDatetimeToDate, JsonParsed, stringToBool } from 'src/validation';
import z from 'zod';

export enum AssetMediaSize {
  Original = 'original',
  /**
   * An full-sized image extracted/converted from non-web-friendly formats like RAW/HIF.
   * or otherwise the original image itself.
   */
  FULLSIZE = 'fullsize',
  PREVIEW = 'preview',
  THUMBNAIL = 'thumbnail',
}

const AssetMediaSizeSchema = z.enum(AssetMediaSize).describe('Asset media size').meta({ id: 'AssetMediaSize' });

const AssetMediaOptionsSchema = z
  .object({
    size: AssetMediaSizeSchema.optional(),
    edited: stringToBool.default(false).optional().describe('Return edited asset if available'),
  })
  .meta({ id: 'AssetMediaOptionsDto' });

export enum UploadFieldName {
  ASSET_DATA = 'assetData',
  SIDECAR_DATA = 'sidecarData',
  PROFILE_DATA = 'file',
}

const AssetMediaBaseSchema = z.object({
  deviceAssetId: z.string().describe('Device asset ID'),
  deviceId: z.string().describe('Device ID'),
  fileCreatedAt: isoDatetimeToDate.describe('File creation date'),
  fileModifiedAt: isoDatetimeToDate.describe('File modification date'),
  duration: z.string().optional().describe('Duration (for videos)'),
  filename: z.string().optional().describe('Filename'),
  /** The properties below are added to correctly generate the API docs and client SDKs. Validation should be handled in the controller. */
  [UploadFieldName.ASSET_DATA]: z.any().describe('Asset file data').meta({ type: 'string', format: 'binary' }),
});

const AssetMediaCreateSchema = AssetMediaBaseSchema.extend({
  isFavorite: stringToBool.optional().describe('Mark as favorite'),
  visibility: AssetVisibilitySchema.optional(),
  livePhotoVideoId: z.uuidv4().optional().describe('Live photo video ID'),
  metadata: JsonParsed.pipe(z.array(AssetMetadataUpsertItemSchema)).optional().describe('Asset metadata items'),
  [UploadFieldName.SIDECAR_DATA]: z
    .any()
    .optional()
    .describe('Sidecar file data')
    .meta({ type: 'string', format: 'binary' }),
}).meta({ id: 'AssetMediaCreateDto' });

const AssetMediaReplaceSchema = AssetMediaBaseSchema.meta({ id: 'AssetMediaReplaceDto' });

const AssetBulkUploadCheckItemSchema = z
  .object({
    id: z.string().describe('Asset ID'),
    checksum: z.string().describe('Base64 or hex encoded SHA1 hash'),
  })
  .meta({ id: 'AssetBulkUploadCheckItem' });

const AssetBulkUploadCheckSchema = z
  .object({
    assets: z.array(AssetBulkUploadCheckItemSchema).describe('Assets to check'),
  })
  .meta({ id: 'AssetBulkUploadCheckDto' });

const CheckExistingAssetsSchema = z
  .object({
    deviceAssetIds: z.array(z.string()).min(1).describe('Device asset IDs to check'),
    deviceId: z.string().describe('Device ID'),
  })
  .meta({ id: 'CheckExistingAssetsDto' });

export class AssetMediaOptionsDto extends createZodDto(AssetMediaOptionsSchema) {}
export class AssetMediaCreateDto extends createZodDto(AssetMediaCreateSchema) {}
export class AssetMediaReplaceDto extends createZodDto(AssetMediaReplaceSchema) {}
export class AssetBulkUploadCheckDto extends createZodDto(AssetBulkUploadCheckSchema) {}
export class CheckExistingAssetsDto extends createZodDto(CheckExistingAssetsSchema) {}
