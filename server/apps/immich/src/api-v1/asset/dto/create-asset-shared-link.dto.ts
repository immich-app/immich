import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDate, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAssetsShareLinkDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ApiProperty({
    isArray: true,
    type: String,
    title: 'Array asset IDs to be shared',
    example: [
      'bf973405-3f2a-48d2-a687-2ed4167164be',
      'dd41870b-5d00-46d2-924e-1d8489a0aa0f',
      'fad77c3f-deef-4e7e-9608-14c1aa4e559a',
    ],
  })
  assetIds!: string[];

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  expiresAt?: Date;

  @IsBoolean()
  @IsOptional()
  allowUpload?: boolean;

  @IsBoolean()
  @IsOptional()
  allowDownload?: boolean;

  @IsBoolean()
  @IsOptional()
  showExif?: boolean;

  @IsString()
  @IsOptional()
  description?: string;
}
