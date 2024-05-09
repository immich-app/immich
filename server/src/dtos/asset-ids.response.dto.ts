import { ValidateUUID } from 'src/validation';

/** @deprecated Use `BulkIdResponseDto` instead */
export enum AssetIdErrorReason {
  DUPLICATE = 'duplicate',
  NO_PERMISSION = 'no_permission',
  NOT_FOUND = 'not_found',
}

/** @deprecated Use `BulkIdResponseDto` instead */
export class AssetIdsResponseDto {
  assetId!: string;
  success!: boolean;
  error?: AssetIdErrorReason;
}

export enum BulkIdErrorReason {
  DUPLICATE = 'duplicate',
  NO_PERMISSION = 'no_permission',
  NOT_FOUND = 'not_found',
  UNKNOWN = 'unknown',
}

export class BulkIdsDto {
  @ValidateUUID({ each: true })
  ids!: string[];
}

export class BulkIdResponseDto {
  id!: string;
  success!: boolean;
  error?: BulkIdErrorReason;
}
