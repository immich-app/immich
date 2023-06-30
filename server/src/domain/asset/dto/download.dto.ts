import { ValidateUUID } from '@app/immich/decorators/validate-uuid.decorator';
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive } from 'class-validator';

export class DownloadDto {
  @ValidateUUID({ each: true, optional: true })
  assetIds?: string[];

  @ValidateUUID({ optional: true })
  albumId?: string;

  @ValidateUUID({ optional: true })
  userId?: string;

  @IsInt()
  @IsPositive()
  @IsOptional()
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
