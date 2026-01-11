import { BadRequestException } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
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

@ApiSchema({ description: 'Asset media options with size and edited flag' })
export class AssetMediaOptionsDto {
  @ApiProperty({ description: 'Asset media size', enum: AssetMediaSize, required: false })
  @ValidateEnum({ enum: AssetMediaSize, name: 'AssetMediaSize', optional: true })
  size?: AssetMediaSize;

  @ApiPropertyOptional({ description: 'Return edited asset if available', default: false })
  @ValidateBoolean({ optional: true, default: false })
  edited?: boolean;
}

export enum UploadFieldName {
  ASSET_DATA = 'assetData',
  SIDECAR_DATA = 'sidecarData',
  PROFILE_DATA = 'file',
}

@ApiSchema({ description: 'Base asset media DTO with device info and file metadata' })
class AssetMediaBase {
  @ApiProperty({ description: 'Device asset ID' })
  @IsNotEmpty()
  @IsString()
  deviceAssetId!: string;

  @ApiProperty({ description: 'Device ID' })
  @IsNotEmpty()
  @IsString()
  deviceId!: string;

  @ApiProperty({ description: 'File creation date' })
  @ValidateDate()
  fileCreatedAt!: Date;

  @ApiProperty({ description: 'File modification date' })
  @ValidateDate()
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

@ApiSchema({ description: 'Asset media creation request with file data and optional metadata' })
export class AssetMediaCreateDto extends AssetMediaBase {
  @ApiPropertyOptional({ description: 'Mark as favorite' })
  @ValidateBoolean({ optional: true })
  isFavorite?: boolean;

  @ApiPropertyOptional({ description: 'Asset visibility', enum: AssetVisibility })
  @ValidateEnum({ enum: AssetVisibility, name: 'AssetVisibility', optional: true })
  visibility?: AssetVisibility;

  @ApiPropertyOptional({ description: 'Live photo video ID' })
  @ValidateUUID({ optional: true })
  livePhotoVideoId?: string;

  @ApiPropertyOptional({ description: 'Asset metadata items', type: () => [AssetMetadataUpsertItemDto] })
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

@ApiSchema({ description: 'Asset media replace request with file data' })
export class AssetMediaReplaceDto extends AssetMediaBase {}

@ApiSchema({ description: 'Asset bulk upload check item with ID and checksum' })
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

@ApiSchema({ description: 'Asset bulk upload check request with assets array' })
export class AssetBulkUploadCheckDto {
  @ApiProperty({ description: 'Assets to check', type: [AssetBulkUploadCheckItem] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssetBulkUploadCheckItem)
  assets!: AssetBulkUploadCheckItem[];
}

@ApiSchema({ description: 'Check existing assets request with device asset IDs and device ID' })
export class CheckExistingAssetsDto {
  @ApiProperty({ description: 'Device asset IDs to check', type: [String] })
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  deviceAssetIds!: string[];

  @ApiProperty({ description: 'Device ID' })
  @IsNotEmpty()
  deviceId!: string;
}
