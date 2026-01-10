import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { ValidateEnum } from 'src/validation';

export enum AssetMediaStatus {
  CREATED = 'created',
  REPLACED = 'replaced',
  DUPLICATE = 'duplicate',
}
@ApiSchema({ description: 'Asset media upload response' })
export class AssetMediaResponseDto {
  @ApiProperty({ description: 'Upload status', enum: AssetMediaStatus })
  @ValidateEnum({ enum: AssetMediaStatus, name: 'AssetMediaStatus' })
  status!: AssetMediaStatus;
  @ApiProperty({ description: 'Asset media ID' })
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
  @ApiProperty({ description: 'Asset ID' })
  id!: string;
  @ApiProperty({ description: 'Upload action', enum: AssetUploadAction })
  action!: AssetUploadAction;
  @ApiPropertyOptional({ description: 'Rejection reason if rejected', enum: AssetRejectReason })
  reason?: AssetRejectReason;
  @ApiPropertyOptional({ description: 'Existing asset ID if duplicate' })
  assetId?: string;
  @ApiPropertyOptional({ description: 'Whether existing asset is trashed' })
  isTrashed?: boolean;
}

@ApiSchema({ description: 'Bulk upload check response with results' })
export class AssetBulkUploadCheckResponseDto {
  @ApiProperty({ description: 'Upload check results', type: () => [AssetBulkUploadCheckResult] })
  results!: AssetBulkUploadCheckResult[];
}

@ApiSchema({ description: 'Existing assets check response' })
export class CheckExistingAssetsResponseDto {
  @ApiProperty({ description: 'Existing asset IDs', type: [String] })
  existingIds!: string[];
}
