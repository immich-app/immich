import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsObject, IsPositive, ValidateNested } from 'class-validator';
import { AssetResponseDto, mapAsset } from 'src/dtos/asset-response.dto';
import { AssetEntity } from 'src/entities/asset.entity';
import { MemoryType } from 'src/enum';
import { MemoryItem } from 'src/types';
import { ValidateBoolean, ValidateDate, ValidateUUID } from 'src/validation';

class MemoryBaseDto {
  @ValidateBoolean({ optional: true })
  isSaved?: boolean;

  @ValidateDate({ optional: true })
  seenAt?: Date;
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
  @IsEnum(MemoryType)
  @ApiProperty({ enum: MemoryType, enumName: 'MemoryType' })
  type!: MemoryType;

  @IsObject()
  @ValidateNested()
  @Type((options) => {
    switch (options?.object.type) {
      case MemoryType.ON_THIS_DAY: {
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

export class MemoryResponseDto {
  id!: string;
  createdAt!: Date;
  updatedAt!: Date;
  deletedAt?: Date;
  memoryAt!: Date;
  seenAt?: Date;
  ownerId!: string;
  @ApiProperty({ enumName: 'MemoryType', enum: MemoryType })
  type!: MemoryType;
  data!: MemoryData;
  isSaved!: boolean;
  assets!: AssetResponseDto[];
}

export const mapMemory = (entity: MemoryItem): MemoryResponseDto => {
  return {
    id: entity.id,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    deletedAt: entity.deletedAt ?? undefined,
    memoryAt: entity.memoryAt,
    seenAt: entity.seenAt ?? undefined,
    ownerId: entity.ownerId,
    type: entity.type as MemoryType,
    data: entity.data as unknown as MemoryData,
    isSaved: entity.isSaved,
    assets: ('assets' in entity ? entity.assets : []).map((asset) => mapAsset(asset as AssetEntity)),
  };
};
