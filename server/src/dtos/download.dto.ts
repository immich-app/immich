import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';
import { AssetIdsDto } from 'src/dtos/asset.dto';
import { Optional, ValidateBoolean, ValidateUUID } from 'src/validation';

export class DownloadInfoDto {
  @ValidateUUID({ each: true, optional: true, description: 'Asset IDs to download' })
  assetIds?: string[];

  @ValidateUUID({ optional: true, description: 'Album ID to download' })
  albumId?: string;

  @ValidateUUID({ optional: true, description: 'User ID to download assets from' })
  userId?: string;

  @ApiPropertyOptional({ type: 'integer', description: 'Archive size limit in bytes' })
  @IsInt()
  @IsPositive()
  @Optional()
  archiveSize?: number;
}

export class DownloadResponseDto {
  @ApiProperty({ type: 'integer', description: 'Total size in bytes' })
  totalSize!: number;
  @ApiProperty({ description: 'Archive information' })
  archives!: DownloadArchiveInfo[];
}

export class DownloadArchiveInfo {
  @ApiProperty({ type: 'integer', description: 'Archive size in bytes' })
  size!: number;
  @ApiProperty({ description: 'Asset IDs in this archive' })
  assetIds!: string[];
}

export class DownloadArchiveDto extends AssetIdsDto {
  @ValidateBoolean({ optional: true, description: 'Download edited asset if available' })
  edited?: boolean;
}
