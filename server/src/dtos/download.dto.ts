import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';
import { Optional, ValidateUUID } from 'src/validation';

export class DownloadInfoDto {
  @ValidateUUID({ each: true, optional: true })
  assetIds?: string[];

  @ValidateUUID({ optional: true })
  albumId?: string;

  @ValidateUUID({ optional: true })
  userId?: string;

  @IsInt()
  @IsPositive()
  @Optional()
  @ApiProperty({ type: 'integer' })
  archiveSize?: number;
}

export class DownloadResponseDto {
  @ApiProperty({ type: 'integer' })
  totalSize!: number;
  archives!: DownloadArchiveInfo[];
}

export class DownloadArchiveInfo {
  @ApiProperty({ type: 'integer' })
  size!: number;
  assetIds!: string[];
}
