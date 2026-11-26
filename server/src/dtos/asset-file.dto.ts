import { createZodDto } from '@immich/nestjs-standard-schema/zod';
import { Selectable } from 'kysely';
import z from 'zod';
import { AssetFileTypeSchema } from 'src/enum.js';
import { AssetFileTable } from 'src/schema/tables/asset-file.table.js';
import { isoDatetimeToDate, stringToBool } from 'src/validation.js';

export class AssetFileSearchDto extends createZodDto({
  assetId: z.uuidv4().describe('Asset ID to filter files by'),
  type: AssetFileTypeSchema.optional().describe('Filter by type of file'),
  isEdited: stringToBool.optional().describe('The file was generated from an edit'),
  isProgressive: stringToBool.optional().describe('The file is a progressively encoded JPEG'),
  isTransparent: stringToBool.optional().describe('The file is transparent'),
}) {}

export class AssetFileResponseDto extends createZodDto({
  id: z.uuidv4().describe('Asset file ID'),
  createdAt: isoDatetimeToDate.describe('Creation date'),
  updatedAt: isoDatetimeToDate.describe('Update date'),
  type: AssetFileTypeSchema.describe('Type of file'),
  path: z.string().describe('File path'),
  isEdited: z.boolean().describe('The file was generated from an edit'),
  isProgressive: z.boolean().describe('The file is a progressively encoded JPEG'),
  isTransparent: z.boolean().describe('The file is transparent'),
}) {}

export const mapAssetFile = (file: Selectable<AssetFileTable>): AssetFileResponseDto => {
  return {
    id: file.id,
    createdAt: file.createdAt,
    updatedAt: file.updatedAt,
    type: file.type,
    path: file.path,
    isEdited: file.isEdited,
    isProgressive: file.isProgressive,
    isTransparent: file.isTransparent,
  };
};
