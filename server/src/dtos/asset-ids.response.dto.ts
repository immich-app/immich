import { createZodDto } from '@immich/nestjs-standard-schema/zod';
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

export enum BulkIdErrorReason {
  DUPLICATE = 'duplicate',
  NO_PERMISSION = 'no_permission',
  NOT_FOUND = 'not_found',
  UNKNOWN = 'unknown',
  VALIDATION = 'validation',
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

/** @deprecated Use `BulkIdResponseDto` instead */
export class AssetIdsResponseDto extends createZodDto({
  assetId: z.uuidv4().describe('Asset ID'),
  success: z.boolean().describe('Whether operation succeeded'),
  error: AssetIdErrorReasonSchema.optional(),
}) {}

export class BulkIdsDto extends createZodDto(BulkIdsSchema) {}

export class BulkIdResponseDto extends createZodDto({
  id: z.uuidv4().describe('ID'),
  success: z.boolean().describe('Whether operation succeeded'),
  error: BulkIdErrorReasonSchema.optional(),
  errorMessage: z.string().optional(),
}) {}
