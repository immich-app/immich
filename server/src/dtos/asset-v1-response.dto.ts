export class AssetBulkUploadCheckResult {
  id!: string;
  action!: AssetUploadAction;
  reason?: AssetRejectReason;
  assetId?: string;
}

export class AssetBulkUploadCheckResponseDto {
  results!: AssetBulkUploadCheckResult[];
}

export enum AssetUploadAction {
  ACCEPT = 'accept',
  REJECT = 'reject',
}

export enum AssetRejectReason {
  DUPLICATE = 'duplicate',
  UNSUPPORTED_FORMAT = 'unsupported-format',
}

export class AssetFileUploadResponseDto {
  id!: string;
  duplicate!: boolean;
}

export class CheckExistingAssetsResponseDto {
  existingIds!: string[];
}
