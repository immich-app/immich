import { createZodDto } from '@immich/nestjs-standard-schema/zod';
import z from 'zod';
import { AssetResponseSchema } from 'src/dtos/asset-response.dto.js';

const DuplicateResolveGroupSchema = z
  .object({
    duplicateId: z.uuidv4(),
    keepAssetIds: z.array(z.uuidv4()).describe('Asset IDs to keep'),
    trashAssetIds: z.array(z.uuidv4()).describe('Asset IDs to trash or delete'),
  })
  .meta({ id: 'DuplicateResolveGroupDto' });

export class DuplicateResponseDto extends createZodDto({
  duplicateId: z.uuidv4().describe('Duplicate group ID'),
  assets: z.array(AssetResponseSchema).describe('Duplicate assets'),
  suggestedKeepAssetIds: z.array(z.uuidv4()).describe('Suggested asset IDs to keep based on file size and EXIF data'),
}) {}

export class DuplicateResolveGroupDto extends createZodDto(DuplicateResolveGroupSchema) {}

export class DuplicateResolveDto extends createZodDto({
  groups: z.array(DuplicateResolveGroupSchema).min(1).describe('List of duplicate groups to resolve'),
}) {}
