import { createZodDto } from 'nestjs-zod';
import { Memory } from 'src/database';
import { HistoryBuilder } from 'src/decorators';
import { AssetResponseSchema, mapAsset } from 'src/dtos/asset-response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { AssetOrderWithRandomSchema, MemoryType, MemoryTypeSchema } from 'src/enum';
import { isoDatetimeToDate, nonEmptyPartial, stringToBool } from 'src/validation';
import z from 'zod';

const MemorySearchSchema = z
  .object({
    type: MemoryTypeSchema.optional(),
    for: isoDatetimeToDate.optional().describe('Filter by date'),
    isTrashed: stringToBool.optional().describe('Include trashed memories'),
    isSaved: stringToBool.optional().describe('Filter by saved status'),
    size: z.coerce.number().int().min(1).optional().describe('Number of memories to return'),
    order: AssetOrderWithRandomSchema.optional(),
  })
  .meta({ id: 'MemorySearchDto' });

const OnThisDaySchema = z
  .object({
    year: z.int().min(1000).max(9999).describe('Year for on this day memory'),
  })
  .meta({ id: 'OnThisDayDto' });

type MemoryData = z.infer<typeof OnThisDaySchema>;

const MemoryUpdateSchema = nonEmptyPartial({
  isSaved: z.boolean().describe('Is memory saved'),
  seenAt: isoDatetimeToDate.describe('Date when memory was seen'),
  memoryAt: isoDatetimeToDate.describe('Memory date'),
}).meta({ id: 'MemoryUpdateDto' });

const MemoryCreateSchema = z
  .object({
    type: MemoryTypeSchema,
    data: OnThisDaySchema,
    memoryAt: isoDatetimeToDate.describe('Memory date'),
    assetIds: z.array(z.uuidv4()).optional().describe('Asset IDs to associate with memory'),
    isSaved: z.boolean().optional().describe('Is memory saved'),
    seenAt: isoDatetimeToDate.optional().describe('Date when memory was seen'),
    showAt: isoDatetimeToDate
      .optional()
      .describe('Date when memory should be shown')
      .meta(new HistoryBuilder().added('v2.6.0').stable('v2.6.0').getExtensions()),
    hideAt: isoDatetimeToDate
      .optional()
      .describe('Date when memory should be hidden')
      .meta(new HistoryBuilder().added('v2.6.0').stable('v2.6.0').getExtensions()),
  })
  .meta({ id: 'MemoryCreateDto' });

const MemoryStatisticsResponseSchema = z
  .object({
    total: z.int().describe('Total number of memories'),
  })
  .meta({ id: 'MemoryStatisticsResponseDto' });

const MemoryResponseSchema = z
  .object({
    id: z.string().describe('Memory ID'),
    createdAt: isoDatetimeToDate.describe('Creation date'),
    updatedAt: isoDatetimeToDate.describe('Last update date'),
    deletedAt: isoDatetimeToDate.optional().describe('Deletion date'),
    memoryAt: isoDatetimeToDate.describe('Memory date'),
    seenAt: isoDatetimeToDate.optional().describe('Date when memory was seen'),
    showAt: isoDatetimeToDate.optional().describe('Date when memory should be shown'),
    hideAt: isoDatetimeToDate.optional().describe('Date when memory should be hidden'),
    ownerId: z.string().describe('Owner user ID'),
    type: MemoryTypeSchema,
    data: OnThisDaySchema,
    isSaved: z.boolean().describe('Is memory saved'),
    assets: z.array(AssetResponseSchema),
  })
  .meta({ id: 'MemoryResponseDto' });

export class MemorySearchDto extends createZodDto(MemorySearchSchema) {}
export class MemoryUpdateDto extends createZodDto(MemoryUpdateSchema) {}
export class MemoryCreateDto extends createZodDto(MemoryCreateSchema) {}
export class MemoryStatisticsResponseDto extends createZodDto(MemoryStatisticsResponseSchema) {}
export class MemoryResponseDto extends createZodDto(MemoryResponseSchema) {}

export const mapMemory = (entity: Memory, auth: AuthDto): MemoryResponseDto => {
  return {
    id: entity.id,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    deletedAt: entity.deletedAt ?? undefined,
    memoryAt: entity.memoryAt,
    seenAt: entity.seenAt ?? undefined,
    showAt: entity.showAt ?? undefined,
    hideAt: entity.hideAt ?? undefined,
    ownerId: entity.ownerId,
    type: entity.type as MemoryType,
    data: entity.data as unknown as MemoryData,
    isSaved: entity.isSaved,
    assets: ('assets' in entity ? entity.assets : []).map((asset) => mapAsset(asset, { auth })),
  };
};
