import { createZodDto } from 'nestjs-zod';
import { Memory } from 'src/database';
import { HistoryBuilder } from 'src/decorators';
import { AssetResponseSchema, mapAsset } from 'src/dtos/asset-response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { AssetOrderWithRandomSchema, MemoryType, MemoryTypeSchema } from 'src/enum';
import { AnyMemoryData, MemoryDataOf } from 'src/types';
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

const MemoryDataSchema = z.record(z.string(), z.unknown()).describe('Memory data');

const getMemoryDisplay = (type: MemoryType, data: Record<string, unknown>) => {
  if (type !== MemoryType.Rule) {
    return { title: undefined, subtitle: undefined };
  }

  return {
    title: typeof data.title === 'string' ? data.title : undefined,
    subtitle: typeof data.subtitle === 'string' ? data.subtitle : undefined,
  };
};

const MemoryUpdateSchema = nonEmptyPartial({
  isSaved: z.boolean().describe('Is memory saved'),
  seenAt: isoDatetimeToDate.describe('Date when memory was seen'),
  memoryAt: isoDatetimeToDate.describe('Memory date'),
}).meta({ id: 'MemoryUpdateDto' });

const MemoryCreateSchema = z
  .object({
    type: MemoryTypeSchema,
    data: MemoryDataSchema,
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
  .refine(({ data, type }) => type !== MemoryType.OnThisDay || OnThisDaySchema.safeParse(data).success, {
    error: 'Invalid input: expected number, received undefined',
    path: ['data', 'year'],
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
    data: MemoryDataSchema,
    title: z.string().optional().describe('Server-defined display title'),
    subtitle: z.string().optional().describe('Server-defined display subtitle'),
    isSaved: z.boolean().describe('Is memory saved'),
    assets: z.array(AssetResponseSchema),
  })
  .meta({ id: 'MemoryResponseDto' });

export type MemoryDataDto<T extends MemoryType = MemoryType> = MemoryDataOf<T>;
export type MemoryResponse<T extends MemoryType = MemoryType> = Omit<
  z.infer<typeof MemoryResponseSchema>,
  'type' | 'data'
> & {
  type: T;
  data: MemoryDataDto<T>;
};

export class MemorySearchDto extends createZodDto(MemorySearchSchema) {}
export class MemoryUpdateDto extends createZodDto(MemoryUpdateSchema) {}
export class MemoryCreateDto extends createZodDto(MemoryCreateSchema) {}
export class MemoryStatisticsResponseDto extends createZodDto(MemoryStatisticsResponseSchema) {}
export class MemoryResponseDto extends createZodDto(MemoryResponseSchema) {}

export const mapMemory = (entity: Memory, auth: AuthDto): MemoryResponseDto => {
  const data = entity.data as AnyMemoryData;
  const { title, subtitle } = getMemoryDisplay(entity.type as MemoryType, data);

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
    data,
    title,
    subtitle,
    isSaved: entity.isSaved,
    assets: ('assets' in entity ? entity.assets : []).map((asset) => mapAsset(asset, { auth })),
  };
};
