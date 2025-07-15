import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsObject, IsPositive, ValidateNested } from 'class-validator';
import { Memory } from 'src/database';
import { AssetResponseDto, mapAsset } from 'src/dtos/asset-response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { MemoryType } from 'src/enum';
import { ValidateBoolean, ValidateDate, ValidateEnum, ValidateUUID } from 'src/validation';

class MemoryBaseDto {
  @ValidateBoolean({ optional: true })
  isSaved?: boolean;

  @ValidateDate({ optional: true })
  seenAt?: Date;
}

export class MemorySearchDto {
  @ValidateEnum({ enum: MemoryType, name: 'MemoryType', optional: true })
  type?: MemoryType;

  @ValidateDate({ optional: true })
  for?: Date;

  @ValidateBoolean({ optional: true })
  isTrashed?: boolean;

  @ValidateBoolean({ optional: true })
  isSaved?: boolean;
}

class OnThisDayDto {
  @IsInt()
  @IsPositive()
  year!: number;
}

type MemoryData = OnThisDayDto;

export class MemoryUpdateDto extends MemoryBaseDto {
  @ValidateDate({ optional: true })
  memoryAt?: Date;
}

export class MemoryCreateDto extends MemoryBaseDto {
  @ValidateEnum({ enum: MemoryType, name: 'MemoryType' })
  type!: MemoryType;

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

  @ValidateDate()
  memoryAt!: Date;

  @ValidateUUID({ optional: true, each: true })
  assetIds?: string[];
}

export class MemoryStatisticsResponseDto {
  @ApiProperty({ type: 'integer' })
  total!: number;
}

export class MemoryResponseDto {
  id!: string;
  createdAt!: Date;
  updatedAt!: Date;
  deletedAt?: Date;
  memoryAt!: Date;
  seenAt?: Date;
  showAt?: Date;
  hideAt?: Date;
  ownerId!: string;
  @ValidateEnum({ enum: MemoryType, name: 'MemoryType' })
  type!: MemoryType;
  data!: MemoryData;
  isSaved!: boolean;
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
