import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsObject } from 'class-validator';
import { AssetResponseDto, mapAsset } from 'src/dtos/asset-response.dto';
import { MemoryEntity, MemoryType } from 'src/entities/memory.entity';
import { ValidateBoolean, ValidateDate, ValidateUUID } from 'src/validation';

type MemoryData = any;

class MemoryBaseDto {
  @ValidateBoolean({ optional: true })
  isSaved?: boolean;

  @ValidateDate({ optional: true })
  seenAt?: Date;
}

export class MemoryUpdateDto extends MemoryBaseDto {
  @ValidateDate({ optional: true })
  memoryAt?: Date;
}

export class MemoryCreateDto extends MemoryBaseDto {
  @IsEnum(MemoryType)
  @ApiProperty({ enum: MemoryType, enumName: 'MemoryType' })
  type!: MemoryType;

  @IsObject()
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
  type!: MemoryType;
  data!: MemoryData;
  isSaved!: boolean;
  assets!: AssetResponseDto[];
}

export const mapMemory = (entity: MemoryEntity): MemoryResponseDto => {
  return {
    id: entity.id,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    deletedAt: entity.deletedAt,
    memoryAt: entity.memoryAt,
    seenAt: entity.seenAt,
    ownerId: entity.ownerId,
    type: entity.type,
    data: entity.data,
    isSaved: entity.isSaved,
    assets: entity.assets.map((asset) => mapAsset(asset)),
  };
};
