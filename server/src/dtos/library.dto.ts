import { createZodDto } from 'nestjs-zod';
import { Library } from 'src/database';
import { isoDatetimeToDate } from 'src/validation';
import z from 'zod';

const stringArrayMax128 = z
  .array(z.string())
  .max(128)
  .refine((arr) => arr.every((s) => s.trim() !== ''), 'Array items must not be empty')
  .refine((arr) => new Set(arr).size === arr.length, 'Array must have unique items');

const CreateLibrarySchema = z
  .object({
    ownerId: z.uuidv4().describe('Owner user ID'),
    name: z.string().min(1).optional().describe('Library name'),
    importPaths: stringArrayMax128.optional().describe('Import paths (max 128)'),
    exclusionPatterns: stringArrayMax128.optional().describe('Exclusion patterns (max 128)'),
  })
  .meta({ id: 'CreateLibraryDto' });

const UpdateLibrarySchema = z
  .object({
    name: z.string().min(1).optional().describe('Library name'),
    importPaths: stringArrayMax128.optional().describe('Import paths (max 128)'),
    exclusionPatterns: stringArrayMax128.optional().describe('Exclusion patterns (max 128)'),
  })
  .meta({ id: 'UpdateLibraryDto' });

export interface CrawlOptionsDto {
  pathsToCrawl: string[];
  includeHidden?: boolean;
  exclusionPatterns?: string[];
}

export interface WalkOptionsDto extends CrawlOptionsDto {
  take: number;
}

const ValidateLibrarySchema = z
  .object({
    importPaths: stringArrayMax128.optional().describe('Import paths to validate (max 128)'),
    exclusionPatterns: stringArrayMax128.optional().describe('Exclusion patterns (max 128)'),
  })
  .meta({ id: 'ValidateLibraryDto' });

const ValidateLibraryImportPathResponseSchema = z
  .object({
    importPath: z.string().describe('Import path'),
    isValid: z.boolean().describe('Is valid'),
    message: z.string().optional().describe('Validation message'),
  })
  .meta({ id: 'ValidateLibraryImportPathResponseDto' });

const ValidateLibraryResponseSchema = z
  .object({
    importPaths: z
      .array(ValidateLibraryImportPathResponseSchema)
      .optional()
      .describe('Validation results for import paths'),
  })
  .meta({ id: 'ValidateLibraryResponseDto' });

const LibraryResponseSchema = z
  .object({
    id: z.string().describe('Library ID'),
    ownerId: z.string().describe('Owner user ID'),
    name: z.string().describe('Library name'),
    assetCount: z.int().describe('Number of assets'),
    importPaths: z.array(z.string()).describe('Import paths'),
    exclusionPatterns: z.array(z.string()).describe('Exclusion patterns'),
    createdAt: isoDatetimeToDate.describe('Creation date'),
    updatedAt: isoDatetimeToDate.describe('Last update date'),
    refreshedAt: isoDatetimeToDate.nullable().describe('Last refresh date'),
  })
  .meta({ id: 'LibraryResponseDto' });

const LibraryStatsResponseSchema = z
  .object({
    photos: z.int().describe('Number of photos'),
    videos: z.int().describe('Number of videos'),
    total: z.int().describe('Total number of assets'),
    usage: z.int().describe('Storage usage in bytes'),
  })
  .meta({ id: 'LibraryStatsResponseDto' });

export class CreateLibraryDto extends createZodDto(CreateLibrarySchema) {}
export class UpdateLibraryDto extends createZodDto(UpdateLibrarySchema) {}
export class ValidateLibraryDto extends createZodDto(ValidateLibrarySchema) {}
export class ValidateLibraryResponseDto extends createZodDto(ValidateLibraryResponseSchema) {}
export class ValidateLibraryImportPathResponseDto extends createZodDto(ValidateLibraryImportPathResponseSchema) {}
export class LibraryResponseDto extends createZodDto(LibraryResponseSchema) {}
export class LibraryStatsResponseDto extends createZodDto(LibraryStatsResponseSchema) {}

export function mapLibrary(entity: Library): LibraryResponseDto {
  let assetCount = 0;
  if (entity.assets) {
    assetCount = entity.assets.length;
  }
  return {
    id: entity.id,
    ownerId: entity.ownerId,
    name: entity.name,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    refreshedAt: entity.refreshedAt,
    assetCount,
    importPaths: entity.importPaths,
    exclusionPatterns: entity.exclusionPatterns,
  };
}
