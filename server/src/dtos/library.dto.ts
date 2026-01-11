import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayUnique, IsNotEmpty, IsString } from 'class-validator';
import { Library } from 'src/database';
import { Optional, ValidateUUID } from 'src/validation';

@ApiSchema({ description: 'Library creation request with owner, name, import paths, and exclusion patterns' })
export class CreateLibraryDto {
  @ApiProperty({ description: 'Owner user ID' })
  @ValidateUUID()
  ownerId!: string;

  @ApiPropertyOptional({ description: 'Library name' })
  @IsString()
  @Optional()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ description: 'Import paths (max 128)', type: [String] })
  @Optional()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ArrayUnique()
  @ArrayMaxSize(128)
  importPaths?: string[];

  @ApiPropertyOptional({ description: 'Exclusion patterns (max 128)', type: [String] })
  @Optional()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ArrayUnique()
  @ArrayMaxSize(128)
  exclusionPatterns?: string[];
}

@ApiSchema({ description: 'Library update request with optional name, import paths, and exclusion patterns' })
export class UpdateLibraryDto {
  @ApiPropertyOptional({ description: 'Library name' })
  @Optional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ description: 'Import paths (max 128)', type: [String] })
  @Optional()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ArrayUnique()
  @ArrayMaxSize(128)
  importPaths?: string[];

  @ApiPropertyOptional({ description: 'Exclusion patterns (max 128)', type: [String] })
  @Optional()
  @IsNotEmpty({ each: true })
  @IsString({ each: true })
  @ArrayUnique()
  @ArrayMaxSize(128)
  exclusionPatterns?: string[];
}

export interface CrawlOptionsDto {
  pathsToCrawl: string[];
  includeHidden?: boolean;
  exclusionPatterns?: string[];
}

export interface WalkOptionsDto extends CrawlOptionsDto {
  take: number;
}

@ApiSchema({ description: 'Library validation request with import paths and exclusion patterns' })
export class ValidateLibraryDto {
  @ApiPropertyOptional({ description: 'Import paths to validate (max 128)', type: [String] })
  @Optional()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ArrayUnique()
  @ArrayMaxSize(128)
  importPaths?: string[];

  @ApiPropertyOptional({ description: 'Exclusion patterns (max 128)', type: [String] })
  @Optional()
  @IsNotEmpty({ each: true })
  @IsString({ each: true })
  @ArrayUnique()
  @ArrayMaxSize(128)
  exclusionPatterns?: string[];
}

@ApiSchema({ description: 'Library validation response with results' })
export class ValidateLibraryResponseDto {
  @ApiPropertyOptional({
    description: 'Validation results for import paths',
    type: () => [ValidateLibraryImportPathResponseDto],
  })
  importPaths?: ValidateLibraryImportPathResponseDto[];
}

@ApiSchema({ description: 'Library import path validation response' })
export class ValidateLibraryImportPathResponseDto {
  @ApiProperty({ description: 'Import path' })
  importPath!: string;
  @ApiProperty({ description: 'Is valid' })
  isValid: boolean = false;
  @ApiPropertyOptional({ description: 'Validation message' })
  message?: string;
}

@ApiSchema({ description: 'Library search query with optional user ID filter' })
export class LibrarySearchDto {
  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @ValidateUUID({ optional: true })
  userId?: string;
}

@ApiSchema({ description: 'Library response with import paths' })
export class LibraryResponseDto {
  @ApiProperty({ description: 'Library ID' })
  id!: string;
  @ApiProperty({ description: 'Owner user ID' })
  ownerId!: string;
  @ApiProperty({ description: 'Library name' })
  name!: string;

  @ApiProperty({ type: 'integer', description: 'Number of assets' })
  assetCount!: number;

  @ApiProperty({ description: 'Import paths', type: [String] })
  importPaths!: string[];

  @ApiProperty({ description: 'Exclusion patterns', type: [String] })
  exclusionPatterns!: string[];

  @ApiProperty({ description: 'Creation date' })
  createdAt!: Date;
  @ApiProperty({ description: 'Last update date' })
  updatedAt!: Date;
  @ApiProperty({ description: 'Last refresh date', nullable: true })
  refreshedAt!: Date | null;
}

@ApiSchema({ description: 'Library statistics with asset counts' })
export class LibraryStatsResponseDto {
  @ApiProperty({ type: 'integer', description: 'Number of photos' })
  photos = 0;

  @ApiProperty({ type: 'integer', description: 'Number of videos' })
  videos = 0;

  @ApiProperty({ type: 'integer', description: 'Total number of assets' })
  total = 0;

  @ApiProperty({ type: 'integer', format: 'int64', description: 'Storage usage in bytes' })
  usage = 0;
}

export function mapLibrary(entity: Library): LibraryResponseDto {
  let assetCount = 0;
  if (entity.assets) {
    assetCount = entity.assets.length;
  }
  return {
    id: entity.id,
    ownerId: entity.ownerId,
    name: entity.name,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    refreshedAt: entity.refreshedAt,
    assetCount,
    importPaths: entity.importPaths,
    exclusionPatterns: entity.exclusionPatterns,
  };
}
