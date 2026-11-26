import { createZodDto } from '@immich/nestjs-standard-schema/zod';
import z from 'zod';
import { Library } from 'src/database.js';
import { isoDatetimeToDate } from 'src/validation.js';

const stringArrayMax128 = z
  .array(z.string())
  .max(128)
  .refine((arr) => arr.every((s) => s.trim() !== ''), 'Array items must not be empty')
  .refine((arr) => new Set(arr).size === arr.length, 'Array must have unique items');

export interface CrawlOptionsDto {
  pathsToCrawl: string[];
  includeHidden?: boolean;
  exclusionPatterns?: string[];
}

export interface MatchOptionsDto extends CrawlOptionsDto {
  extensions?: string[];
}

export interface WalkOptionsDto extends CrawlOptionsDto {
  take: number;
}

const ValidateLibraryImportPathResponseSchema = z
  .object({
    importPath: z.string().describe('Import path'),
    isValid: z.boolean().describe('Is valid'),
    message: z.string().optional().describe('Validation message'),
  })
  .meta({ id: 'ValidateLibraryImportPathResponseDto' });

export class CreateLibraryDto extends createZodDto({
  ownerId: z.uuidv4().describe('Owner user ID'),
  name: z.string().min(1).optional().describe('Library name'),
  importPaths: stringArrayMax128.optional().describe('Import paths (max 128)'),
  exclusionPatterns: stringArrayMax128.optional().describe('Exclusion patterns (max 128)'),
}) {}

export class UpdateLibraryDto extends createZodDto({
  name: z.string().min(1).optional().describe('Library name'),
  importPaths: stringArrayMax128.optional().describe('Import paths (max 128)'),
  exclusionPatterns: stringArrayMax128.optional().describe('Exclusion patterns (max 128)'),
}) {}

export class ValidateLibraryDto extends createZodDto({
  importPaths: stringArrayMax128.optional().describe('Import paths to validate (max 128)'),
  exclusionPatterns: stringArrayMax128.optional().describe('Exclusion patterns (max 128)'),
}) {}

export class ValidateLibraryResponseDto extends createZodDto({
  importPaths: z
    .array(ValidateLibraryImportPathResponseSchema)
    .optional()
    .describe('Validation results for import paths'),
}) {}

export class ValidateLibraryImportPathResponseDto extends createZodDto(ValidateLibraryImportPathResponseSchema) {}

export class LibraryResponseDto extends createZodDto({
  id: z.uuidv4().describe('Library ID'),
  ownerId: z.uuidv4().describe('Owner user ID'),
  name: z.string().describe('Library name'),
  assetCount: z.int().describe('Number of assets'),
  importPaths: z.array(z.string()).describe('Import paths'),
  exclusionPatterns: z.array(z.string()).describe('Exclusion patterns'),
  createdAt: isoDatetimeToDate.describe('Creation date'),
  updatedAt: isoDatetimeToDate.describe('Last update date'),
  refreshedAt: isoDatetimeToDate.nullable().describe('Last refresh date'),
}) {}

export class LibraryStatsResponseDto extends createZodDto({
  photos: z.int().describe('Number of photos'),
  videos: z.int().describe('Number of videos'),
  total: z.int().describe('Total number of assets'),
  usage: z.int().describe('Storage usage in bytes'),
}) {}

export function mapLibrary(entity: Library): LibraryResponseDto {
  const assetCount = entity.assets ? entity.assets.length : 0;
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
