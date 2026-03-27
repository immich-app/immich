import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMinSize, IsBoolean, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class ClassificationCategoryCreateDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Category name' })
  name!: string;

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ArrayMinSize(1)
  @ApiProperty({ description: 'Text prompts for CLIP matching', type: [String] })
  prompts!: string[];

  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  @ApiPropertyOptional({ description: 'Similarity threshold (0-1, higher = stricter)', default: 0.28 })
  similarity?: number;

  @IsString()
  @IsIn(['tag', 'tag_and_archive'])
  @IsOptional()
  @ApiPropertyOptional({ description: 'Action on match', enum: ['tag', 'tag_and_archive'] })
  action?: string;
}

export class ClassificationCategoryUpdateDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Category name' })
  name?: string;

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ArrayMinSize(1)
  @IsOptional()
  @ApiPropertyOptional({ description: 'Text prompts for CLIP matching', type: [String] })
  prompts?: string[];

  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  @ApiPropertyOptional({ description: 'Similarity threshold (0-1, higher = stricter)' })
  similarity?: number;

  @IsString()
  @IsIn(['tag', 'tag_and_archive'])
  @IsOptional()
  @ApiPropertyOptional({ description: 'Action on match', enum: ['tag', 'tag_and_archive'] })
  action?: string;

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Enable or disable category' })
  enabled?: boolean;
}

export class ClassificationCategoryResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ type: [String] })
  prompts!: string[];

  @ApiProperty()
  similarity!: number;

  @ApiProperty({ enum: ['tag', 'tag_and_archive'] })
  action!: string;

  @ApiProperty()
  enabled!: boolean;

  @ApiProperty({ nullable: true, type: String })
  tagId!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
