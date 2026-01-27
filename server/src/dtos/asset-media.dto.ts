import { BadRequestException } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { plainToInstance, Transform, Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { AssetMetadataUpsertItemDto } from 'src/dtos/asset.dto';
import { AssetVisibility } from 'src/enum';
import { Optional, ValidateBoolean, ValidateDate, ValidateEnum, ValidateUUID } from 'src/validation';

export enum AssetMediaSize {
  Original = 'original',
  /**
   * An full-sized image extracted/converted from non-web-friendly formats like RAW/HIF.
   * or otherwise the original image itself.
   */
  FULLSIZE = 'fullsize',
  PREVIEW = 'preview',
  THUMBNAIL = 'thumbnail',
}

export class AssetMediaOptionsDto {
  @ValidateEnum({ enum: AssetMediaSize, name: 'AssetMediaSize', description: 'Asset media size', optional: true })
  size?: AssetMediaSize;

  @ValidateBoolean({ optional: true, description: 'Return edited asset if available', default: false })
  edited?: boolean;
}

export enum UploadFieldName {
  ASSET_DATA = 'assetData',
  SIDECAR_DATA = 'sidecarData',
  PROFILE_DATA = 'file',
}

class AssetMediaBase {
  @ApiProperty({ description: 'Device asset ID' })
  @IsNotEmpty()
  @IsString()
  deviceAssetId!: string;

  @ApiProperty({ description: 'Device ID' })
  @IsNotEmpty()
  @IsString()
  deviceId!: string;

  @ValidateDate({ description: 'File creation date' })
  fileCreatedAt!: Date;

  @ValidateDate({ description: 'File modification date' })
  fileModifiedAt!: Date;

  @ApiPropertyOptional({ description: 'Duration (for videos)' })
  @Optional()
  @IsString()
  duration?: string;

  @ApiPropertyOptional({ description: 'Filename' })
  @Optional()
  @IsString()
  filename?: string;

  // The properties below are added to correctly generate the API docs
  // and client SDKs. Validation should be handled in the controller.
  @ApiProperty({ type: 'string', format: 'binary', description: 'Asset file data' })
  [UploadFieldName.ASSET_DATA]!: any;
}

export class AssetMediaCreateDto extends AssetMediaBase {
  @ValidateBoolean({ optional: true, description: 'Mark as favorite' })
  isFavorite?: boolean;

  @ValidateEnum({ enum: AssetVisibility, name: 'AssetVisibility', description: 'Asset visibility', optional: true })
  visibility?: AssetVisibility;

  @ValidateUUID({ optional: true, description: 'Live photo video ID' })
  livePhotoVideoId?: string;

  @ApiPropertyOptional({ description: 'Asset metadata items' })
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
  metadata?: AssetMetadataUpsertItemDto[];

  @ApiProperty({ type: 'string', format: 'binary', required: false, description: 'Sidecar file data' })
  [UploadFieldName.SIDECAR_DATA]?: any;
}

export class AssetMediaReplaceDto extends AssetMediaBase {}

export class AssetBulkUploadCheckItem {
  @ApiProperty({ description: 'Asset ID' })
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiProperty({ description: 'Base64 or hex encoded SHA1 hash' })
  @IsString()
  @IsNotEmpty()
  checksum!: string;
}

export class AssetBulkUploadCheckDto {
  @ApiProperty({ description: 'Assets to check' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssetBulkUploadCheckItem)
  assets!: AssetBulkUploadCheckItem[];
}

export class CheckExistingAssetsDto {
  @ApiProperty({ description: 'Device asset IDs to check' })
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  deviceAssetIds!: string[];

  @ApiProperty({ description: 'Device ID' })
  @IsNotEmpty()
  deviceId!: string;
}
