import { BadRequestException } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { plainToInstance, Transform, Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { AssetMetadataUpsertItemDto } from 'src/dtos/asset.dto';
import { AssetVisibility } from 'src/enum';
import { Optional, ValidateBoolean, ValidateDate, ValidateEnum, ValidateUUID } from 'src/validation';

export enum AssetMediaSize {
  /**
   * An full-sized image extracted/converted from non-web-friendly formats like RAW/HIF.
   * or otherwise the original image itself.
   */
  FULLSIZE = 'fullsize',
  PREVIEW = 'preview',
  THUMBNAIL = 'thumbnail',
}

export class AssetMediaOptionsDto {
  @ValidateEnum({ enum: AssetMediaSize, name: 'AssetMediaSize', optional: true })
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

  @Optional()
  @IsString()
  filename?: string;

  // The properties below are added to correctly generate the API docs
  // and client SDKs. Validation should be handled in the controller.
  @ApiProperty({ type: 'string', format: 'binary' })
  [UploadFieldName.ASSET_DATA]!: any;
}

export class AssetMediaCreateDto extends AssetMediaBase {
  @ValidateBoolean({ optional: true })
  isFavorite?: boolean;

  @ValidateEnum({ enum: AssetVisibility, name: 'AssetVisibility', optional: true })
  visibility?: AssetVisibility;

  @ValidateUUID({ optional: true })
  livePhotoVideoId?: string;

  @Transform(({ value }) => {
    try {
      const json = JSON.parse(value);
      const items = Array.isArray(json) ? json : [json];
      return items.map((item) => plainToInstance(AssetMetadataUpsertItemDto, item));
    } catch {
      throw new BadRequestException(['metadata must be valid JSON']);
    }
  })
  @Optional()
  @ValidateNested({ each: true })
  @IsArray()
  metadata!: AssetMetadataUpsertItemDto[];

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
