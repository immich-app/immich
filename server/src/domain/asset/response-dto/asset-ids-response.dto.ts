export enum AssetIdErrorReason {
  DUPLICATE = 'duplicate',
  NO_PERMISSION = 'no_permission',
  NOT_FOUND = 'not_found',
}

export class AssetIdsResponseDto {
  assetId!: string;
  success!: boolean;
  error?: AssetIdErrorReason;
}
