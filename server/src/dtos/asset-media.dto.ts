import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsEnum, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Optional, ValidateBoolean, ValidateDate, ValidateUUID } from 'src/validation';

export enum AssetMediaSize {
  PREVIEW = 'preview',
  THUMBNAIL = 'thumbnail',
}

export class AssetMediaOptionsDto {
  @Optional()
  @IsEnum(AssetMediaSize)
  @ApiProperty({ enumName: 'AssetMediaSize', enum: AssetMediaSize })
  size?: AssetMediaSize;
}

export enum UploadFieldName {
  ASSET_DATA = 'assetData',
  SIDECAR_DATA = 'sidecarData',
  PROFILE_DATA = 'file',
}

class AssetMediaBase {
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

  // The properties below are added to correctly generate the API docs
  // and client SDKs. Validation should be handled in the controller.
  @ApiProperty({ type: 'string', format: 'binary' })
  [UploadFieldName.ASSET_DATA]!: any;
}

export class AssetMediaCreateDto extends AssetMediaBase {
  @ValidateBoolean({ optional: true })
  isFavorite?: boolean;

  @ValidateBoolean({ optional: true })
  isArchived?: boolean;

  @ValidateBoolean({ optional: true })
  isVisible?: boolean;

  @ValidateUUID({ optional: true })
  livePhotoVideoId?: string;

  @ApiProperty({ type: 'string', format: 'binary', required: false })
  [UploadFieldName.SIDECAR_DATA]?: any;
}

export class AssetMediaReplaceDto extends AssetMediaBase {}

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

export class CheckExistingAssetsDto {
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  deviceAssetIds!: string[];

  @IsNotEmpty()
  deviceId!: string;
}
