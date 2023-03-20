export class CheckExistingAssetResponseDto {
  constructor(id: string, action: string, reason = '') {
    this.id = id;
    this.action = action;
    this.reason = reason;
  }

  id!: string;
  // "Accept" or "Reject"
  action!: string;
  // empty or "Duplicate"
  // In the future we might also do "Unsupported" if we want to pre-upload mime type checks etc.
  reason?: string;
}

export class CheckExistingAssetsResponseDto {
  constructor(assets: CheckExistingAssetResponseDto[]) {
    this.assets = assets;
  }
  assets!: CheckExistingAssetResponseDto[];
}
