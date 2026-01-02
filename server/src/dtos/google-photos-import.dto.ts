import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class GooglePhotosImportFromDriveDto {
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ description: 'Array of Google Drive file IDs to import' })
  fileIds!: string[];
}

export class GooglePhotosImportJobDto {
  @IsUUID()
  @ApiProperty({ description: 'Import job ID' })
  id!: string;
}

export class GooglePhotosImportProgressDto {
  @ApiProperty({ enum: ['extracting', 'parsing', 'uploading', 'complete'] })
  phase!: 'extracting' | 'parsing' | 'uploading' | 'complete';

  @ApiProperty({ description: 'Current progress count' })
  current!: number;

  @ApiProperty({ description: 'Total items to process' })
  total!: number;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Current file being processed', required: false })
  currentFile?: string;

  @ApiProperty({ description: 'Number of albums found' })
  albumsFound!: number;

  @ApiProperty({ description: 'Number of photos with metadata' })
  photosMatched!: number;

  @ApiProperty({ description: 'Number of photos missing metadata' })
  photosMissingMetadata!: number;

  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ description: 'List of errors encountered' })
  errors!: string[];
}

export class GoogleDriveFileDto {
  @IsString()
  @ApiProperty({ description: 'Google Drive file ID' })
  id!: string;

  @IsString()
  @ApiProperty({ description: 'File name' })
  name!: string;

  @ApiProperty({ description: 'File size in bytes' })
  size!: number;

  @IsString()
  @ApiProperty({ description: 'Creation timestamp' })
  createdTime!: string;

  @IsString()
  @ApiProperty({ description: 'MIME type' })
  mimeType!: string;
}

export class GoogleDriveFilesResponseDto {
  @IsArray()
  @ApiProperty({ type: [GoogleDriveFileDto] })
  files!: GoogleDriveFileDto[];
}
