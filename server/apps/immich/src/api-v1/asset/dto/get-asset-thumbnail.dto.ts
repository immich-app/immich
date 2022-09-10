import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export enum GetAssetThumbnailFormatEnum {
  JPEG = 'JPEG',
  WEBP = 'WEBP',
}

export class GetAssetThumbnailDto {
  @IsOptional()
  @ApiProperty({
    enum: GetAssetThumbnailFormatEnum,
    default: GetAssetThumbnailFormatEnum.WEBP,
    required: false,
    enumName: 'ThumbnailFormat',
  })
  format = GetAssetThumbnailFormatEnum.WEBP;
}
