import { SharedLinkType } from '@app/database/entities/shared-link.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

export class CreateSharedLinkDto {
  @IsOptional()
  description?: string;

  @IsOptional()
  expiredAt?: string;

  @IsNotEmpty()
  @IsEnum(SharedLinkType, {
    message: `params must be one of ${Object.values(SharedLinkType).join()}`,
  })
  @ApiProperty({
    type: String,
    enum: SharedLinkType,
    enumName: 'SharedLinkType',
  })
  sharedType!: SharedLinkType;

  @ValidateIf((dto) => dto.sharedType === SharedLinkType.INDIVIDUAL)
  @IsNotEmpty({ each: true })
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({
    isArray: true,
    type: String,
    title: 'Array of asset IDs to add to the shared link',
    example: [
      'bf973405-3f2a-48d2-a687-2ed4167164be',
      'dd41870b-5d00-46d2-924e-1d8489a0aa0f',
      'fad77c3f-deef-4e7e-9608-14c1aa4e559a',
    ],
  })
  assetIds!: string[];

  @ValidateIf((dto) => dto.sharedType === SharedLinkType.ALBUM)
  @IsNotEmpty()
  albumId!: string;
}
