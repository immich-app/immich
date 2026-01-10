import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsObject, IsPositive, ValidateNested } from 'class-validator';
import { Memory } from 'src/database';
import { AssetResponseDto, mapAsset } from 'src/dtos/asset-response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { AssetOrderWithRandom, MemoryType } from 'src/enum';
import { Optional, ValidateBoolean, ValidateDate, ValidateEnum, ValidateUUID } from 'src/validation';

class MemoryBaseDto {
  @ApiPropertyOptional({ description: 'Is memory saved' })
  @ValidateBoolean({ optional: true })
  isSaved?: boolean;

  @ApiPropertyOptional({ description: 'Date when memory was seen', format: 'date-time' })
  @ValidateDate({ optional: true })
  seenAt?: Date;
}

export class MemorySearchDto {
  @ApiPropertyOptional({ description: 'Memory type', enum: MemoryType })
  @ValidateEnum({ enum: MemoryType, name: 'MemoryType', optional: true })
  type?: MemoryType;

  @ApiPropertyOptional({ description: 'Filter by date', format: 'date-time' })
  @ValidateDate({ optional: true })
  for?: Date;

  @ApiPropertyOptional({ description: 'Include trashed memories' })
  @ValidateBoolean({ optional: true })
  isTrashed?: boolean;

  @ApiPropertyOptional({ description: 'Filter by saved status' })
  @ValidateBoolean({ optional: true })
  isSaved?: boolean;

  @IsInt()
  @IsPositive()
  @Type(() => Number)
  @Optional()
  @ApiProperty({ type: 'integer', description: 'Number of memories to return' })
  size?: number;

  @ApiPropertyOptional({ description: 'Sort order', enum: AssetOrderWithRandom })
  @ValidateEnum({ enum: AssetOrderWithRandom, name: 'MemorySearchOrder', optional: true })
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
  @ApiPropertyOptional({ description: 'Memory date', format: 'date-time' })
  @ValidateDate({ optional: true })
  memoryAt?: Date;
}

export class MemoryCreateDto extends MemoryBaseDto {
  @ApiProperty({ description: 'Memory type', enum: MemoryType })
  @ValidateEnum({ enum: MemoryType, name: 'MemoryType' })
  type!: MemoryType;

  @ApiProperty({ description: 'Memory data (type-specific)', type: () => OnThisDayDto })
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

  @ApiProperty({ description: 'Memory date', format: 'date-time' })
  @ValidateDate()
  memoryAt!: Date;

  @ApiPropertyOptional({ description: 'Asset IDs to associate with memory', type: [String] })
  @ValidateUUID({ optional: true, each: true })
  assetIds?: string[];
}

export class MemoryStatisticsResponseDto {
  @ApiProperty({ type: 'integer', description: 'Total number of memories' })
  total!: number;
}

export class MemoryResponseDto {
  @ApiProperty({ description: 'Memory ID' })
  id!: string;
  @ApiProperty({ description: 'Creation date', format: 'date-time' })
  createdAt!: Date;
  @ApiProperty({ description: 'Last update date', format: 'date-time' })
  updatedAt!: Date;
  @ApiPropertyOptional({ description: 'Deletion date', format: 'date-time', nullable: true })
  deletedAt?: Date;
  @ApiProperty({ description: 'Memory date', format: 'date-time' })
  memoryAt!: Date;
  @ApiPropertyOptional({ description: 'Date when memory was seen', format: 'date-time', nullable: true })
  seenAt?: Date;
  @ApiPropertyOptional({ description: 'Date when memory should be shown', format: 'date-time', nullable: true })
  showAt?: Date;
  @ApiPropertyOptional({ description: 'Date when memory should be hidden', format: 'date-time', nullable: true })
  hideAt?: Date;
  @ApiProperty({ description: 'Owner user ID' })
  ownerId!: string;
  @ApiProperty({ description: 'Memory type', enum: MemoryType })
  @ValidateEnum({ enum: MemoryType, name: 'MemoryType' })
  type!: MemoryType;
  @ApiProperty({ description: 'Memory data (type-specific)', type: () => OnThisDayDto })
  data!: MemoryData;
  @ApiProperty({ description: 'Is memory saved' })
  isSaved!: boolean;
  @ApiProperty({ description: 'Associated assets', type: () => [AssetResponseDto] })
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
