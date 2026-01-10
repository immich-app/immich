import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';
import { Optional, ValidateUUID } from 'src/validation';

export class DownloadInfoDto {
  @ApiPropertyOptional({ description: 'Asset IDs to download', type: [String] })
  @ValidateUUID({ each: true, optional: true })
  assetIds?: string[];

  @ApiPropertyOptional({ description: 'Album ID to download' })
  @ValidateUUID({ optional: true })
  albumId?: string;

  @ApiPropertyOptional({ description: 'User ID to download assets from' })
  @ValidateUUID({ optional: true })
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
  @ApiProperty({ description: 'Archive information', type: [DownloadArchiveInfo] })
  archives!: DownloadArchiveInfo[];
}

export class DownloadArchiveInfo {
  @ApiProperty({ type: 'integer', description: 'Archive size in bytes' })
  size!: number;
  @ApiProperty({ description: 'Asset IDs in this archive', type: [String] })
  assetIds!: string[];
}
