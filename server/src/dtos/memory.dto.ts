import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsObject, IsPositive, ValidateNested } from 'class-validator';
import { Memory } from 'src/database';
import { HistoryBuilder } from 'src/decorators';
import { AssetResponseDto, mapAsset } from 'src/dtos/asset-response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { AssetOrderWithRandom, MemoryType } from 'src/enum';
import { Optional, ValidateBoolean, ValidateDate, ValidateEnum, ValidateUUID } from 'src/validation';

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

class OnThisDayDto {
  @ApiProperty({ type: 'number', description: 'Year for on this day memory', minimum: 1 })
  @IsInt()
  @IsPositive()
  year!: number;
}

type MemoryData = OnThisDayDto;

export class MemoryUpdateDto extends MemoryBaseDto {
  @ValidateDate({ optional: true, description: 'Memory date' })
  memoryAt?: Date;
}

export class MemoryCreateDto extends MemoryBaseDto {
  @ValidateEnum({ enum: MemoryType, name: 'MemoryType', description: 'Memory type' })
  type!: MemoryType;

  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  @IsObject()
  @ValidateNested()
  @Type((options) => {
    switch (options?.object.type) {
      case MemoryType.OnThisDay: {
        return OnThisDayDto;
      }

      default: {
        return Object;
      }
    }
  })
  data!: MemoryData;

  @ValidateDate({ description: 'Memory date' })
  memoryAt!: Date;

  @ValidateDate({
    optional: true,
    description: 'Date when memory should be shown',
    history: new HistoryBuilder().added('v2.6.0').stable('v2.6.0'),
  })
  showAt?: Date;

  @ValidateDate({
    optional: true,
    description: 'Date when memory should be hidden',
    history: new HistoryBuilder().added('v2.6.0').stable('v2.6.0'),
  })
  hideAt?: Date;

  @ValidateUUID({ optional: true, each: true, description: 'Asset IDs to associate with memory' })
  assetIds?: string[];
}

export class MemoryStatisticsResponseDto {
  @ApiProperty({ type: 'integer', description: 'Total number of memories' })
  total!: number;
}

export class MemoryResponseDto {
  @ApiProperty({ description: 'Memory ID' })
  id!: string;
  @ValidateDate({ description: 'Creation date' })
  createdAt!: Date;
  @ValidateDate({ description: 'Last update date' })
  updatedAt!: Date;
  @ValidateDate({ optional: true, description: 'Deletion date' })
  deletedAt?: Date;
  @ValidateDate({ description: 'Memory date' })
  memoryAt!: Date;
  @ValidateDate({ optional: true, description: 'Date when memory was seen' })
  seenAt?: Date;
  @ValidateDate({ optional: true, description: 'Date when memory should be shown' })
  showAt?: Date;
  @ValidateDate({ optional: true, description: 'Date when memory should be hidden' })
  hideAt?: Date;
  @ApiProperty({ description: 'Owner user ID' })
  ownerId!: string;
  @ValidateEnum({ enum: MemoryType, name: 'MemoryType', description: 'Memory type' })
  type!: MemoryType;
  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  data!: MemoryData;
  @ApiProperty({ description: 'Is memory saved' })
  isSaved!: boolean;
  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  assets!: AssetResponseDto[];
}

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
