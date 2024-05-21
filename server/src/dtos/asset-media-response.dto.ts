import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { AssetResponseDto } from 'src/dtos/asset-response.dto';
import { Optional } from 'src/validation';

export class CheckExistingAssetsResponseDto {
  existingIds!: string[];
}

export enum AssetUploadAction {
  ACCEPT = 'accept',
  REJECT = 'reject',
}

export enum AssetRejectReason {
  DUPLICATE = 'duplicate',
  UNSUPPORTED_FORMAT = 'unsupported-format',
}

export class AssetBulkUploadCheckResult {
  id!: string;
  action!: AssetUploadAction;
  reason?: AssetRejectReason;
  assetId?: string;
}

export class AssetBulkUploadCheckResponseDto {
  results!: AssetBulkUploadCheckResult[];
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

export class AssetMediaResponseDto {
  @ApiProperty({
    type: String,
  })
  readonly status?: string;
  @IsOptional()
  asset?: AssetResponseDto;
  @IsOptional()
  backup?: AssetResponseDto;
  @IsOptional()
  duplicate?: AssetResponseDto;
}

export class AssetMediaCreatedResponse {
  @ApiProperty({
    type: String,
    default: 'created',
  })
  readonly status = 'created';
  asset: AssetResponseDto;
  constructor(asset: AssetResponseDto) {
    this.asset = asset;
  }
}
export class AssetMediaUpdatedResponse {
  @ApiProperty({
    type: String,
    default: 'updated',
  })
  readonly status = 'updated';
  asset: AssetResponseDto;
  backup: AssetResponseDto;
  constructor(asset: AssetResponseDto, backup: AssetResponseDto) {
    this.asset = asset;
    this.backup = backup;
  }
}
export class DuplicateAssetResponse {
  @ApiProperty({
    type: String,
    default: 'duplicate',
  })
  readonly status = 'duplicate';
  duplicate: AssetResponseDto;
  constructor(duplicate: AssetResponseDto) {
    this.duplicate = duplicate;
  }
}

export type AssetMediaResponse = AssetMediaCreatedResponse | AssetMediaUpdatedResponse | DuplicateAssetResponse;
