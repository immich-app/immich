import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsHexColor, IsNotEmpty, IsString } from 'class-validator';
import { createZodDto } from 'nestjs-zod';
import { Tag } from 'src/database';
import { Optional, ValidateHexColor, ValidateUUID } from 'src/validation';
import { z } from 'zod';

export class TagCreateDto {
  @ApiProperty({ description: 'Tag name' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ValidateUUID({ nullable: true, optional: true, description: 'Parent tag ID' })
  parentId?: string | null;

  @ApiPropertyOptional({ description: 'Tag color (hex)' })
  @IsHexColor()
  @Optional({ nullable: true, emptyToNull: true })
  color?: string;
}

export class TagUpdateDto {
  @ApiPropertyOptional({ description: 'Tag color (hex)' })
  @Optional({ nullable: true, emptyToNull: true })
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

export const TagResponseSchema = z
  .object({
    id: z.string().describe('Tag ID'),
    parentId: z.string().optional().describe('Parent tag ID'),
    name: z.string().describe('Tag name'),
    value: z.string().describe('Tag value (full path)'),
    createdAt: z.iso.datetime().describe('Creation date'),
    updatedAt: z.iso.datetime().describe('Last update date'),
    color: z.string().optional().describe('Tag color (hex)'),
  })
  .meta({ id: 'TagResponseDto' });

export class TagResponseDto extends createZodDto(TagResponseSchema) {}

export function mapTag(entity: Tag): TagResponseDto {
  return {
    id: entity.id,
    parentId: entity.parentId ?? undefined,
    name: entity.value.split('/').at(-1) as string,
    value: entity.value,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
    color: entity.color ?? undefined,
  };
}
