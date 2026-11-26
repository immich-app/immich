import { createZodDto } from '@immich/nestjs-standard-schema/zod';
import z from 'zod';

export enum AssetMediaStatus {
  CREATED = 'created',
  DUPLICATE = 'duplicate',
}

const AssetMediaStatusSchema = z.enum(AssetMediaStatus).describe('Upload status').meta({ id: 'AssetMediaStatus' });

export enum AssetUploadAction {
  ACCEPT = 'accept',
  REJECT = 'reject',
}

const AssetUploadActionSchema = z.enum(AssetUploadAction).describe('Upload action').meta({ id: 'AssetUploadAction' });

export enum AssetRejectReason {
  DUPLICATE = 'duplicate',
  UNSUPPORTED_FORMAT = 'unsupported-format',
}

const AssetRejectReasonSchema = z
  .enum(AssetRejectReason)
  .describe('Rejection reason if rejected')
  .meta({ id: 'AssetRejectReason' });

const AssetBulkUploadCheckResultSchema = z
  .object({
    id: z.string().describe('Client-side identifier echoed from the request to match results to inputs'),
    action: AssetUploadActionSchema,
    reason: AssetRejectReasonSchema.optional(),
    assetId: z.uuidv4().optional().describe('Existing asset ID if duplicate'),
    isTrashed: z.boolean().optional().describe('Whether existing asset is trashed'),
  })
  .meta({ id: 'AssetBulkUploadCheckResult' });

export class AssetMediaResponseDto extends createZodDto({
  status: AssetMediaStatusSchema,
  id: z.uuidv4().describe('Asset media ID'),
}) {}

export class AssetBulkUploadCheckResponseDto extends createZodDto({
  results: z.array(AssetBulkUploadCheckResultSchema).describe('Upload check results'),
}) {}
