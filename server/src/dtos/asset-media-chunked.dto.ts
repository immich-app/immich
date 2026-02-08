import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { AssetVisibility } from 'src/enum';
import { Optional, ValidateBoolean, ValidateDate, ValidateUUID } from 'src/validation';

/**
 * Chunked upload support for bypassing reverse proxy body size limits.
 *
 * When uploading through Cloudflare or other reverse proxies with body size
 * limits (e.g. Cloudflare's 100MB free-tier limit), large files need to be
 * split into smaller chunks that each fit within the proxy's limit.
 *
 * Flow:
 * 1. POST /assets/chunked-upload — create an upload session
 * 2. POST /assets/chunked-upload/:sessionId/chunks — upload each chunk
 * 3. POST /assets/chunked-upload/:sessionId/finish — finalize and create the asset
 */

export enum ChunkSize {
  /** 25 MB — safe for most restrictive proxies */
  SMALL = 25 * 1024 * 1024,
  /** 50 MB — good balance between performance and compatibility */
  MEDIUM = 50 * 1024 * 1024,
}

export class CreateChunkedUploadSessionDto {
  @ApiProperty({ description: 'Original filename of the asset' })
  @IsNotEmpty()
  @IsString()
  filename!: string;

  @ApiProperty({ description: 'Total file size in bytes' })
  @IsInt()
  @Min(1)
  fileSize!: number;

  @ApiProperty({ description: 'Chunk size in bytes (default: 50MB, min: 1MB, max: 100MB)' })
  @IsInt()
  @Min(1 * 1024 * 1024)
  @Max(100 * 1024 * 1024)
  @IsOptional()
  chunkSize?: number;

  @ApiProperty({ description: 'Device asset ID' })
  @IsNotEmpty()
  @IsString()
  deviceAssetId!: string;

  @ApiProperty({ description: 'Device ID' })
  @IsNotEmpty()
  @IsString()
  deviceId!: string;

  @ValidateDate({ description: 'File creation date' })
  fileCreatedAt!: Date;

  @ValidateDate({ description: 'File modification date' })
  fileModifiedAt!: Date;

  @ApiPropertyOptional({ description: 'Duration (for videos)' })
  @Optional()
  @IsString()
  duration?: string;

  @ValidateBoolean({ optional: true, description: 'Mark as favorite' })
  isFavorite?: boolean;

  @ApiPropertyOptional({
    enum: AssetVisibility,
    description: 'Asset visibility',
  })
  @IsEnum(AssetVisibility)
  @IsOptional()
  visibility?: AssetVisibility;

  @ValidateUUID({ optional: true, description: 'Live photo video ID' })
  livePhotoVideoId?: string;
}

export class ChunkedUploadSessionResponseDto {
  @ApiProperty({ description: 'Upload session ID' })
  sessionId!: string;

  @ApiProperty({ description: 'Chunk size in bytes to use for uploads' })
  chunkSize!: number;

  @ApiProperty({ description: 'Total number of chunks expected' })
  totalChunks!: number;

  @ApiProperty({ description: 'Session expiration time (ISO 8601)' })
  expiresAt!: string;
}

export class UploadChunkDto {
  @ApiProperty({ description: 'Chunk index (0-based)' })
  @IsInt()
  @Min(0)
  chunkIndex!: number;
}

export class UploadChunkResponseDto {
  @ApiProperty({ description: 'Chunk index that was uploaded' })
  chunkIndex!: number;

  @ApiProperty({ description: 'Number of chunks received so far' })
  chunksReceived!: number;

  @ApiProperty({ description: 'Total number of chunks expected' })
  totalChunks!: number;
}

export class FinishChunkedUploadResponseDto {
  @ApiProperty({ description: 'Created asset ID' })
  assetId!: string;

  @ApiProperty({ description: 'Whether the asset is a duplicate' })
  isDuplicate!: boolean;
}
