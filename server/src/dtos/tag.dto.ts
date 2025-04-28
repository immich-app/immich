import { ApiProperty } from '@nestjs/swagger';
import { IsHexColor, IsNotEmpty, IsString } from 'class-validator';
import { Tag } from 'src/database';
import { Optional, ValidateHexColor, ValidateUUID } from 'src/validation';

export class TagCreateDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ValidateUUID({ optional: true, nullable: true })
  parentId?: string | null;

  @IsHexColor()
  @Optional({ nullable: true, emptyToNull: true })
  color?: string;
}

export class TagUpdateDto {
  @IsString()
  @Optional({ emptyToNull: true, nullable: true })
  name?: string;

  @Optional({ emptyToNull: true, nullable: true })
  @ValidateHexColor()
  color?: string | null;
}

export class TagUpsertDto {
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  tags!: string[];
}

export class TagBulkAssetsDto {
  @ValidateUUID({ each: true })
  tagIds!: string[];

  @ValidateUUID({ each: true })
  assetIds!: string[];
}

export class TagBulkAssetsResponseDto {
  @ApiProperty({ type: 'integer' })
  count!: number;
}

export class TagResponseDto {
  id!: string;
  parentId?: string;
  name!: string;
  value!: string;
  createdAt!: Date;
  updatedAt!: Date;
  color?: string;
}

export function mapTag(entity: Tag): TagResponseDto {
  return {
    id: entity.id,
    parentId: entity.parentId ?? undefined,
    name: entity.value.split('/').at(-1) as string,
    value: entity.value,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    color: entity.color ?? undefined,
  };
}
