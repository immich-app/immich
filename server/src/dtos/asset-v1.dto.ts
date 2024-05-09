import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsEnum, IsInt, IsNotEmpty, IsString, IsUUID, ValidateNested } from 'class-validator';
import { UploadFieldName } from 'src/dtos/asset.dto';
import { Optional, ValidateBoolean, ValidateDate, ValidateUUID } from 'src/validation';

export class AssetBulkUploadCheckItem {
  @IsString()
  @IsNotEmpty()
  id!: string;

  /** base64 or hex encoded sha1 hash */
  @IsString()
  @IsNotEmpty()
  checksum!: string;
}

export class AssetBulkUploadCheckDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssetBulkUploadCheckItem)
  assets!: AssetBulkUploadCheckItem[];
}

export class AssetSearchDto {
  @ValidateBoolean({ optional: true })
  isFavorite?: boolean;

  @ValidateBoolean({ optional: true })
  isArchived?: boolean;

  @Optional()
  @IsInt()
  @Type(() => Number)
  @ApiProperty({ type: 'integer' })
  skip?: number;

  @Optional()
  @IsInt()
  @Type(() => Number)
  @ApiProperty({ type: 'integer' })
  take?: number;

  @Optional()
  @IsUUID('4')
  @ApiProperty({ format: 'uuid' })
  userId?: string;

  @ValidateDate({ optional: true })
  updatedAfter?: Date;

  @ValidateDate({ optional: true })
  updatedBefore?: Date;
}

export class CheckExistingAssetsDto {
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  deviceAssetIds!: string[];

  @IsNotEmpty()
  deviceId!: string;
}

export class CreateAssetDto {
  @ValidateUUID({ optional: true })
  libraryId?: string;

  @IsNotEmpty()
  @IsString()
  deviceAssetId!: string;

  @IsNotEmpty()
  @IsString()
  deviceId!: string;

  @ValidateDate()
  fileCreatedAt!: Date;

  @ValidateDate()
  fileModifiedAt!: Date;

  @Optional()
  @IsString()
  duration?: string;

  @ValidateBoolean({ optional: true })
  isFavorite?: boolean;

  @ValidateBoolean({ optional: true })
  isArchived?: boolean;

  @ValidateBoolean({ optional: true })
  isVisible?: boolean;

  @ValidateBoolean({ optional: true })
  isOffline?: boolean;

  // The properties below are added to correctly generate the API docs
  // and client SDKs. Validation should be handled in the controller.
  @ApiProperty({ type: 'string', format: 'binary' })
  [UploadFieldName.ASSET_DATA]!: any;

  @ApiProperty({ type: 'string', format: 'binary', required: false })
  [UploadFieldName.LIVE_PHOTO_DATA]?: any;

  @ApiProperty({ type: 'string', format: 'binary', required: false })
  [UploadFieldName.SIDECAR_DATA]?: any;
}

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

export class ServeFileDto {
  @ValidateBoolean({ optional: true })
  @ApiProperty({ title: 'Is serve thumbnail (resize) file' })
  isThumb?: boolean;

  @ValidateBoolean({ optional: true })
  @ApiProperty({ title: 'Is request made from web' })
  isWeb?: boolean;
}
