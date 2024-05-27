import { ApiProperty } from '@nestjs/swagger';

export enum AssetMediaStatusEnum {
  REPLACED = 'replaced',
  DUPLICATE = 'duplicate',
}
export class AssetMediaResponseDto {
  @ApiProperty({ enum: AssetMediaStatusEnum, enumName: 'AssetMediaStatus' })
  status!: AssetMediaStatusEnum;
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
}

export class AssetBulkUploadCheckResponseDto {
  results!: AssetBulkUploadCheckResult[];
}

export class CheckExistingAssetsResponseDto {
  existingIds!: string[];
}
