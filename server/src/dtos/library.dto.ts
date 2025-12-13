import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayUnique, IsNotEmpty, IsString } from 'class-validator';
import { Library } from 'src/database';
import { Optional, ValidateUUID } from 'src/validation';

export class CreateLibraryDto {
  @ValidateUUID()
  ownerId!: string;

  @IsString()
  @Optional()
  @IsNotEmpty()
  name?: string;

  @Optional()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ArrayUnique()
  @ArrayMaxSize(128)
  importPaths?: string[];

  @Optional()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ArrayUnique()
  @ArrayMaxSize(128)
  exclusionPatterns?: string[];
}

export class UpdateLibraryDto {
  @Optional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @Optional()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ArrayUnique()
  @ArrayMaxSize(128)
  importPaths?: string[];

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

export class ValidateLibraryDto {
  @Optional()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ArrayUnique()
  @ArrayMaxSize(128)
  importPaths?: string[];

  @Optional()
  @IsNotEmpty({ each: true })
  @IsString({ each: true })
  @ArrayUnique()
  @ArrayMaxSize(128)
  exclusionPatterns?: string[];
}

export class ValidateLibraryResponseDto {
  importPaths?: ValidateLibraryImportPathResponseDto[];
}

export class ValidateLibraryImportPathResponseDto {
  importPath!: string;
  isValid: boolean = false;
  message?: string;
}

export class LibrarySearchDto {
  @ValidateUUID({ optional: true })
  userId?: string;
}

export class LibraryResponseDto {
  id!: string;
  ownerId!: string;
  name!: string;

  @ApiProperty({ type: 'integer' })
  assetCount!: number;

  importPaths!: string[];

  exclusionPatterns!: string[];

  createdAt!: Date;
  updatedAt!: Date;
  refreshedAt!: Date | null;
}

export class LibraryStatsResponseDto {
  @ApiProperty({ type: 'integer' })
  photos = 0;

  @ApiProperty({ type: 'integer' })
  videos = 0;

  @ApiProperty({ type: 'integer' })
  total = 0;

  @ApiProperty({ type: 'integer', format: 'int64' })
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
