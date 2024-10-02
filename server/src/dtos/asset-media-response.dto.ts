import { ApiProperty } from '@nestjs/swagger';

export enum AssetMediaStatus {
  CREATED = 'created',
  REPLACED = 'replaced',
  DUPLICATE = 'duplicate',
}
export class AssetMediaResponseDto {
  @ApiProperty({ enum: AssetMediaStatus, enumName: 'AssetMediaStatus' })
  status!: AssetMediaStatus;
  id!: string;
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
  isTrashed?: boolean;
}

export class AssetBulkUploadCheckResponseDto {
  results!: AssetBulkUploadCheckResult[];
}

export class CheckExistingAssetsResponseDto {
  existingIds!: string[];
}
