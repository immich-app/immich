import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayUnique, IsNotEmpty, IsString } from 'class-validator';
import { Library } from 'src/database';
import { Optional, ValidateUUID } from 'src/validation';

export class CreateLibraryDto {
  @ValidateUUID({ description: 'Owner user ID' })
  ownerId!: string;

  @ApiPropertyOptional({ description: 'Library name' })
  @IsString()
  @Optional()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ description: 'Import paths (max 128)' })
  @Optional()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ArrayUnique()
  @ArrayMaxSize(128)
  importPaths?: string[];

  @ApiPropertyOptional({ description: 'Exclusion patterns (max 128)' })
  @Optional()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ArrayUnique()
  @ArrayMaxSize(128)
  exclusionPatterns?: string[];
}

export class UpdateLibraryDto {
  @ApiPropertyOptional({ description: 'Library name' })
  @Optional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ description: 'Import paths (max 128)' })
  @Optional()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ArrayUnique()
  @ArrayMaxSize(128)
  importPaths?: string[];

  @ApiPropertyOptional({ description: 'Exclusion patterns (max 128)' })
  @Optional()
  @IsNotEmpty({ each: true })
  @IsString({ each: true })
  @ArrayUnique()
  @ArrayMaxSize(128)
  exclusionPatterns?: string[];
}

export interface WalkOptionsDto {
  pathsToWalk: string[];
  includeHidden?: boolean;
  exclusionPatterns?: string[];
}

export class ValidateLibraryDto {
  @ApiPropertyOptional({ description: 'Import paths to validate (max 128)' })
  @Optional()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ArrayUnique()
  @ArrayMaxSize(128)
  importPaths?: string[];

  @ApiPropertyOptional({ description: 'Exclusion patterns (max 128)' })
  @Optional()
  @IsNotEmpty({ each: true })
  @IsString({ each: true })
  @ArrayUnique()
  @ArrayMaxSize(128)
  exclusionPatterns?: string[];
}

export class ValidateLibraryResponseDto {
  @ApiPropertyOptional({ description: 'Validation results for import paths' })
  importPaths?: ValidateLibraryImportPathResponseDto[];
}

export class ValidateLibraryImportPathResponseDto {
  @ApiProperty({ description: 'Import path' })
  importPath!: string;
  @ApiProperty({ description: 'Is valid' })
  isValid: boolean = false;
  @ApiPropertyOptional({ description: 'Validation message' })
  message?: string;
}

export class LibrarySearchDto {
  @ValidateUUID({ optional: true, description: 'Filter by user ID' })
  userId?: string;
}

export class LibraryResponseDto {
  @ApiProperty({ description: 'Library ID' })
  id!: string;
  @ApiProperty({ description: 'Owner user ID' })
  ownerId!: string;
  @ApiProperty({ description: 'Library name' })
  name!: string;

  @ApiProperty({ type: 'integer', description: 'Number of assets' })
  assetCount!: number;

  @ApiProperty({ description: 'Import paths' })
  importPaths!: string[];

  @ApiProperty({ description: 'Exclusion patterns' })
  exclusionPatterns!: string[];

  @ApiProperty({ description: 'Creation date' })
  createdAt!: Date;
  @ApiProperty({ description: 'Last update date' })
  updatedAt!: Date;
  @ApiProperty({ description: 'Last refresh date' })
  refreshedAt!: Date | null;
}

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
