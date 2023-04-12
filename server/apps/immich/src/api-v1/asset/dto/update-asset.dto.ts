import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateAssetDto {
  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;

  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ApiProperty({
    isArray: true,
    type: String,
    title: 'Array of tag IDs to add to the asset',
    example: [
      'bf973405-3f2a-48d2-a687-2ed4167164be',
      'dd41870b-5d00-46d2-924e-1d8489a0aa0f',
      'fad77c3f-deef-4e7e-9608-14c1aa4e559a',
    ],
  })
  tagIds?: string[];

  @IsOptional()
  @IsString()
  description?: string;
}
