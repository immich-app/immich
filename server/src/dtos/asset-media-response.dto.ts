import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
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

export enum AssetMediaStatusEnum {
  CREATED = 'created',
  UPDATED = 'updated',
  DUPLICATE = 'duplicate',
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

export class DefaultAssetMediaResponseDto {
  @ApiProperty({
    type: String,
    enum: AssetMediaStatusEnum,
    required: true,
    enumName: 'AssetMediaStatus',
  })
  readonly status?: string;
  @IsOptional()
  assetId?: string;
  @IsOptional()
  copyId?: string;
  @IsOptional()
  duplicateId?: string;
}

export class AssetMediaCreateResponseDto {
  @ApiProperty({
    type: String,
    required: true,
    readOnly: true,
    enum: AssetMediaStatusEnum,
    enumName: 'AssetMediaStatus',
    default: AssetMediaStatusEnum.CREATED,
  })
  readonly status = 'created';
  assetId: string;
  constructor(assetId: string) {
    this.assetId = assetId;
  }
}
export class AssetMediaUpdateResponseDto {
  @ApiProperty({
    type: String,
    required: true,
    readOnly: true,
    enum: AssetMediaStatusEnum,
    enumName: 'AssetMediaStatus',
    default: AssetMediaStatusEnum.UPDATED,
  })
  readonly status = 'updated';
  assetId: string;
  copyId: string;
  constructor(assetId: string, copyId: string) {
    this.assetId = assetId;
    this.copyId = copyId;
  }
}
export class DuplicateAssetResponseDto {
  @ApiProperty({
    type: String,
    required: true,
    readOnly: true,
    enum: AssetMediaStatusEnum,
    enumName: 'AssetMediaStatus',
    default: AssetMediaStatusEnum.DUPLICATE,
  })
  readonly status = 'duplicate';
  duplicateId: string;
  constructor(duplicateId: string) {
    this.duplicateId = duplicateId;
  }
}

export type AssetMediaResponseDto =
  | AssetMediaCreateResponseDto
  | AssetMediaUpdateResponseDto
  | DuplicateAssetResponseDto;
