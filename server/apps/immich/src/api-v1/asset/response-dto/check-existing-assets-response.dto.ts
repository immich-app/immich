export class CheckExistenceOfAssetResponseDto {
  id!: string;
  // "Accept" or "Reject"
  action!: string;
  // empty or "Duplicate"
  // In the future we might also do "Unsupported" if we want to pre-upload mime type checks etc.
  reason?: string;
  // Asset id from the server db
  assetId?: string;
}

export class CheckExistenceOfAssetsResponseDto {
  constructor(assets: CheckExistenceOfAssetResponseDto[]) {
    this.assets = assets;
  }
  assets!: CheckExistenceOfAssetResponseDto[];
}
