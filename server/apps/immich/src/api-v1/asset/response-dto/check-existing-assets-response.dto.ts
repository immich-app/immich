export class CheckExistenceOfAssetResponseDto {
  // id of asset in the server db (field from the asset entity)
  id!: string;

  // A unique identifier chosen by the client
  clientId!: string;

  action!: CheckExistenceOfAssetResponseActionType;
  // In the future we might also do "Unsupported" if we want to pre-upload mime type checks etc.
  reason?: CheckExistenceOfAssetResponseReasonType;
}

export class CheckExistenceOfAssetsResponseDto {
  constructor(assets: CheckExistenceOfAssetResponseDto[]) {
    this.assets = assets;
  }
  assets!: CheckExistenceOfAssetResponseDto[];
}

export enum CheckExistenceOfAssetResponseActionType {
  ACCEPT = 'Accept',
  REJECT = 'Reject',
}

export enum CheckExistenceOfAssetResponseReasonType {
  DUPLICATE = 'Duplicate',
  NONE = '',
}
