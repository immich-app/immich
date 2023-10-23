import { Optional } from '@app/domain';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum GetAssetThumbnailFormatEnum {
  JPEG = 'JPEG',
  WEBP = 'WEBP',
}

export class GetAssetThumbnailDto {
  @Optional()
  @IsEnum(GetAssetThumbnailFormatEnum)
  @ApiProperty({
    type: String,
    enum: GetAssetThumbnailFormatEnum,
    default: GetAssetThumbnailFormatEnum.WEBP,
    required: false,
    enumName: 'ThumbnailFormat',
  })
  format: GetAssetThumbnailFormatEnum = GetAssetThumbnailFormatEnum.WEBP;
}
