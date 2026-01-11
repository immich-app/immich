import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { IsHexColor, IsNotEmpty, IsString } from 'class-validator';
import { Tag } from 'src/database';
import { Optional, ValidateHexColor, ValidateUUID } from 'src/validation';

@ApiSchema({ description: 'Tag creation request with name, optional parent, and color' })
export class TagCreateDto {
  @ApiProperty({ description: 'Tag name' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ description: 'Parent tag ID', nullable: true })
  @ValidateUUID({ optional: true, nullable: true })
  parentId?: string | null;

  @ApiPropertyOptional({ description: 'Tag color (hex)' })
  @IsHexColor()
  @Optional({ nullable: true, emptyToNull: true })
  color?: string;
}

@ApiSchema({ description: 'Tag update request with optional color' })
export class TagUpdateDto {
  @ApiPropertyOptional({ description: 'Tag color (hex)', nullable: true })
  @Optional({ emptyToNull: true, nullable: true })
  @ValidateHexColor()
  color?: string | null;
}

@ApiSchema({ description: 'Tag upsert request with tag names' })
export class TagUpsertDto {
  @ApiProperty({ description: 'Tag names to upsert', type: [String] })
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  tags!: string[];
}

@ApiSchema({ description: 'Tag bulk assets request with tag IDs and asset IDs' })
export class TagBulkAssetsDto {
  @ApiProperty({ description: 'Tag IDs', type: [String] })
  @ValidateUUID({ each: true })
  tagIds!: string[];

  @ApiProperty({ description: 'Asset IDs', type: [String] })
  @ValidateUUID({ each: true })
  assetIds!: string[];
}

@ApiSchema({ description: 'Tag bulk assets operation response' })
export class TagBulkAssetsResponseDto {
  @ApiProperty({ type: 'integer', description: 'Number of assets tagged' })
  count!: number;
}

@ApiSchema({ description: 'Tag response with metadata' })
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
