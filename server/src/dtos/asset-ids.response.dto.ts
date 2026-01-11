import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { ValidateUUID } from 'src/validation';

/** @deprecated Use `BulkIdResponseDto` instead */
export enum AssetIdErrorReason {
  DUPLICATE = 'duplicate',
  NO_PERMISSION = 'no_permission',
  NOT_FOUND = 'not_found',
}

/** @deprecated Use `BulkIdResponseDto` instead */
@ApiSchema({ description: 'Asset ID operation response' })
export class AssetIdsResponseDto {
  @ApiProperty({ description: 'Asset ID' })
  assetId!: string;
  @ApiProperty({ description: 'Whether operation succeeded' })
  success!: boolean;
  @ApiPropertyOptional({ description: 'Error reason if failed', enum: AssetIdErrorReason })
  error?: AssetIdErrorReason;
}

export enum BulkIdErrorReason {
  DUPLICATE = 'duplicate',
  NO_PERMISSION = 'no_permission',
  NOT_FOUND = 'not_found',
  UNKNOWN = 'unknown',
}

@ApiSchema({ description: 'Bulk IDs request with array of UUIDs' })
export class BulkIdsDto {
  @ApiProperty({ description: 'IDs to process', type: [String] })
  @ValidateUUID({ each: true })
  ids!: string[];
}

@ApiSchema({ description: 'Bulk ID operation response' })
export class BulkIdResponseDto {
  @ApiProperty({ description: 'ID' })
  id!: string;
  @ApiProperty({ description: 'Whether operation succeeded' })
  success!: boolean;
  @ApiPropertyOptional({ description: 'Error reason if failed', enum: BulkIdErrorReason })
  error?: BulkIdErrorReason;
}
