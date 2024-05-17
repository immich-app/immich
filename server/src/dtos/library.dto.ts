import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayUnique, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { LibraryEntity, LibraryType } from 'src/entities/library.entity';
import { Optional, ValidateBoolean, ValidateUUID } from 'src/validation';

export class CreateLibraryDto {
  @IsEnum(LibraryType)
  @ApiProperty({ enumName: 'LibraryType', enum: LibraryType })
  type!: LibraryType;

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

export class CrawlOptionsDto {
  pathsToCrawl!: string[];
  includeHidden? = false;
  exclusionPatterns?: string[];
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

export class ScanLibraryDto {
  @ValidateBoolean({ optional: true })
  refreshModifiedFiles?: boolean;

  @ValidateBoolean({ optional: true })
  refreshAllFiles?: boolean;
}

export class SearchLibraryDto {
  @IsEnum(LibraryType)
  @ApiProperty({ enumName: 'LibraryType', enum: LibraryType })
  @Optional()
  type?: LibraryType;
}

export class LibraryResponseDto {
  id!: string;
  ownerId!: string;
  name!: string;

  @ApiProperty({ enumName: 'LibraryType', enum: LibraryType })
  type!: LibraryType;

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

export function mapLibrary(entity: LibraryEntity): LibraryResponseDto {
  let assetCount = 0;
  if (entity.assets) {
    assetCount = entity.assets.length;
  }
  return {
    id: entity.id,
    ownerId: entity.ownerId,
    type: entity.type,
    name: entity.name,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    refreshedAt: entity.refreshedAt,
    assetCount,
    importPaths: entity.importPaths,
    exclusionPatterns: entity.exclusionPatterns,
  };
}
