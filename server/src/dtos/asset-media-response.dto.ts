import { ApiProperty } from '@nestjs/swagger';
import { SyncAssetV1 } from 'src/dtos/sync.dto';

export enum AssetMediaStatus {
  CREATED = 'created',
  REPLACED = 'replaced',
  DUPLICATE = 'duplicate',
}

export class AssetMediaResponseDto {
  @ApiProperty({ enum: AssetMediaStatus, enumName: 'AssetMediaStatus' })
  status!: AssetMediaStatus;
  id!: string;
  payload?: SyncAssetV1;
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
