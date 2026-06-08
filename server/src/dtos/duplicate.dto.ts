import { createZodDto } from 'nestjs-zod';
import { AssetResponseSchema } from 'src/dtos/asset-response.dto';
import z from 'zod';

const DuplicateResponseSchema = z
  .object({
    duplicateId: z.string().describe('Duplicate group ID'),
    assets: z.array(AssetResponseSchema).describe('Duplicate assets'),
    suggestedKeepAssetIds: z.array(z.uuidv4()).describe('Suggested asset IDs to keep based on file size and EXIF data'),
  })
  .meta({ id: 'DuplicateResponseDto' });

const DuplicateResolveGroupSchema = z
  .object({
    duplicateId: z.uuidv4(),
    keepAssetIds: z.array(z.uuidv4()).describe('Asset IDs to keep'),
    trashAssetIds: z.array(z.uuidv4()).describe('Asset IDs to trash or delete'),
  })
  .meta({ id: 'DuplicateResolveGroupDto' });

const DuplicateResolveSchema = z
  .object({
    groups: z.array(DuplicateResolveGroupSchema).min(1).describe('List of duplicate groups to resolve'),
  })
  .meta({ id: 'DuplicateResolveDto' });

export class DuplicateResponseDto extends createZodDto(DuplicateResponseSchema) {}
export class DuplicateResolveGroupDto extends createZodDto(DuplicateResolveGroupSchema) {}
export class DuplicateResolveDto extends createZodDto(DuplicateResolveSchema) {}
