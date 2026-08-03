import { createZodDto } from 'nestjs-zod';
import z from 'zod';

/** @deprecated Use `BulkIdResponseDto` instead */
export enum AssetIdErrorReason {
  DUPLICATE = 'duplicate',
  NO_PERMISSION = 'no_permission',
  NOT_FOUND = 'not_found',
}

const AssetIdErrorReasonSchema = z
  .enum(AssetIdErrorReason)
  .describe('Error reason if failed')
  .meta({ id: 'AssetIdErrorReason' });

/** @deprecated Use `BulkIdResponseDto` instead */
const AssetIdsResponseSchema = z
  .object({
    assetId: z.uuidv4().describe('Asset ID'),
    success: z.boolean().describe('Whether operation succeeded'),
    error: AssetIdErrorReasonSchema.optional(),
  })
  .meta({ id: 'AssetIdsResponseDto' });

export enum BulkIdErrorReason {
  DUPLICATE = 'duplicate',
  NO_PERMISSION = 'no_permission',
  NOT_FOUND = 'not_found',
  UNKNOWN = 'unknown',
  VALIDATION = 'validation',
  // Asset already belongs to a different locked album. An asset can only ever be in one locked
  // album at a time, so adding it to a second one is rejected rather than moving it.
  ALREADY_IN_LOCKED_ALBUM = 'already_in_locked_album',
}

export const BulkIdErrorReasonSchema = z
  .enum(BulkIdErrorReason)
  .describe('Error reason')
  .meta({ id: 'BulkIdErrorReason' });

export const BulkIdsSchema = z
  .object({
    ids: z.array(z.uuidv4()).describe('IDs to process'),
  })
  .meta({ id: 'BulkIdsDto' });

const BulkIdResponseSchema = z
  .object({
    id: z.uuidv4().describe('ID'),
    success: z.boolean().describe('Whether operation succeeded'),
    error: BulkIdErrorReasonSchema.optional(),
    errorMessage: z.string().optional(),
  })
  .meta({ id: 'BulkIdResponseDto' });

/** @deprecated Use `BulkIdResponseDto` instead */
export class AssetIdsResponseDto extends createZodDto(AssetIdsResponseSchema) {}
export class BulkIdsDto extends createZodDto(BulkIdsSchema) {}
export class BulkIdResponseDto extends createZodDto(BulkIdResponseSchema) {}
