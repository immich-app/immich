import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsHexColor, IsNotEmpty, IsString } from 'class-validator';
import { Tag } from 'src/database';
import { Optional, ValidateHexColor, ValidateUUID } from 'src/validation';

export class TagCreateDto {
  @ApiProperty({ description: 'Tag name' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ValidateUUID({ optional: true, description: 'Parent tag ID' })
  parentId?: string | null;

  @ApiPropertyOptional({ description: 'Tag color (hex)' })
  @IsHexColor()
  @Optional({ nullable: true, emptyToNull: true })
  color?: string;
}

export class TagUpdateDto {
  @ApiPropertyOptional({ description: 'Tag color (hex)' })
  @Optional({ emptyToNull: true })
  @ValidateHexColor()
  color?: string | null;
}

export class TagUpsertDto {
  @ApiProperty({ description: 'Tag names to upsert' })
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  tags!: string[];
}

export class TagBulkAssetsDto {
  @ValidateUUID({ each: true, description: 'Tag IDs' })
  tagIds!: string[];

  @ValidateUUID({ each: true, description: 'Asset IDs' })
  assetIds!: string[];
}

export class TagBulkAssetsResponseDto {
  @ApiProperty({ type: 'integer', description: 'Number of assets tagged' })
  count!: number;
}

export class TagResponseDto {
  @ApiProperty({ description: 'Tag ID' })
  id!: string;
  @ApiPropertyOptional({ description: 'Parent tag ID' })
  parentId?: string;
  @ApiProperty({ description: 'Tag name' })
  name!: string;
  @ApiProperty({ description: 'Tag value (full path)' })
  value!: string;
  @ApiProperty({ description: 'Creation date' })
  createdAt!: Date;
  @ApiProperty({ description: 'Last update date' })
  updatedAt!: Date;
  @ApiPropertyOptional({ description: 'Tag color (hex)' })
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
