import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsPositive } from 'class-validator';
import { createZodDto } from 'nestjs-zod';
import { Memory } from 'src/database';
import { AssetResponseSchema, mapAsset } from 'src/dtos/asset-response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { AssetOrderWithRandom, MemoryType, MemoryTypeSchema } from 'src/enum';
import { Optional, ValidateBoolean, ValidateDate, ValidateEnum } from 'src/validation';
import { z } from 'zod';

class MemoryBaseDto {
  @ValidateBoolean({ optional: true, description: 'Is memory saved' })
  isSaved?: boolean;

  @ValidateDate({ optional: true, description: 'Date when memory was seen' })
  seenAt?: Date;
}

export class MemorySearchDto {
  @ValidateEnum({ enum: MemoryType, name: 'MemoryType', description: 'Memory type', optional: true })
  type?: MemoryType;

  @ValidateDate({ optional: true, description: 'Filter by date' })
  for?: Date;

  @ValidateBoolean({ optional: true, description: 'Include trashed memories' })
  isTrashed?: boolean;

  @ValidateBoolean({ optional: true, description: 'Filter by saved status' })
  isSaved?: boolean;

  @IsInt()
  @IsPositive()
  @Type(() => Number)
  @Optional()
  @ApiProperty({ type: 'integer', description: 'Number of memories to return' })
  size?: number;

  @ValidateEnum({ enum: AssetOrderWithRandom, name: 'MemorySearchOrder', description: 'Sort order', optional: true })
  order?: AssetOrderWithRandom;
}

export const OnThisDaySchema = z
  .object({
    year: z
      .int()
      .min(1)
      .max(9999)
      .refine((val) => /^\d{4}$/.test(String(val)), {
        message: 'Year must be exactly 4 digits',
      })
      .describe('Year for on this day memory'),
  })
  .meta({ id: 'OnThisDayDto' });

class OnThisDayDto extends createZodDto(OnThisDaySchema) {}

type MemoryData = OnThisDayDto;

export class MemoryUpdateDto extends MemoryBaseDto {
  @ValidateDate({ optional: true, description: 'Memory date' })
  memoryAt?: Date;
}

export const MemoryCreateSchema = z
  .object({
    type: MemoryTypeSchema.describe('Memory type'),
    data: OnThisDaySchema.describe('Memory type-specific data'),
    memoryAt: z.iso.datetime().describe('Memory date'),
    assetIds: z.array(z.uuidv4()).optional().describe('Asset IDs to associate with memory'),
    isSaved: z.boolean().optional().describe('Is memory saved'),
    seenAt: z.iso.datetime().optional().describe('Date when memory was seen'),
  })
  .meta({ id: 'MemoryCreateDto' });

export class MemoryCreateDto extends createZodDto(MemoryCreateSchema) {}

export class MemoryStatisticsResponseDto {
  @ApiProperty({ type: 'integer', description: 'Total number of memories' })
  total!: number;
}

export const MemoryResponseSchema = z
  .object({
    id: z.string().describe('Memory ID'),
    createdAt: z.iso.datetime().describe('Creation date'),
    updatedAt: z.iso.datetime().describe('Last update date'),
    deletedAt: z.iso.datetime().optional().describe('Deletion date'),
    memoryAt: z.iso.datetime().describe('Memory date'),
    seenAt: z.iso.datetime().optional().describe('Date when memory was seen'),
    showAt: z.iso.datetime().optional().describe('Date when memory should be shown'),
    hideAt: z.iso.datetime().optional().describe('Date when memory should be hidden'),
    ownerId: z.string().describe('Owner user ID'),
    type: MemoryTypeSchema,
    data: OnThisDaySchema,
    isSaved: z.boolean().describe('Is memory saved'),
    assets: z.array(AssetResponseSchema),
  })
  .meta({ id: 'MemoryResponseDto' });

export class MemoryResponseDto extends createZodDto(MemoryResponseSchema) {}

export const mapMemory = (entity: Memory, auth: AuthDto): MemoryResponseDto => {
  return {
    id: entity.id,
    createdAt: new Date(entity.createdAt).toISOString(),
    updatedAt: new Date(entity.updatedAt).toISOString(),
    deletedAt: entity.deletedAt != null ? new Date(entity.deletedAt).toISOString() : undefined,
    memoryAt: new Date(entity.memoryAt).toISOString(),
    seenAt: entity.seenAt != null ? new Date(entity.seenAt).toISOString() : undefined,
    showAt: entity.showAt != null ? new Date(entity.showAt).toISOString() : undefined,
    hideAt: entity.hideAt != null ? new Date(entity.hideAt).toISOString() : undefined,
    ownerId: entity.ownerId,
    type: entity.type as MemoryType,
    data: entity.data as unknown as MemoryData,
    isSaved: entity.isSaved,
    assets: ('assets' in entity ? entity.assets : []).map((asset) => mapAsset(asset, { auth })),
  };
};
