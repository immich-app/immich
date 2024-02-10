import { LibraryEntity, LibraryType } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ValidateUUID } from '../domain.util';

export class CreateLibraryDto {
  @IsEnum(LibraryType)
  @ApiProperty({ enumName: 'LibraryType', enum: LibraryType })
  type!: LibraryType;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @IsOptional()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ArrayUnique()
  importPaths?: string[];

  @IsOptional()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ArrayUnique()
  exclusionPatterns?: string[];

  @IsOptional()
  @IsBoolean()
  isWatched?: boolean;
}

export class UpdateLibraryDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @IsOptional()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ArrayUnique()
  importPaths?: string[];

  @IsOptional()
  @IsNotEmpty({ each: true })
  @IsString({ each: true })
  @ArrayUnique()
  exclusionPatterns?: string[];
}

export class CrawlOptionsDto {
  pathsToCrawl!: string[];
  includeHidden? = false;
  exclusionPatterns?: string[];
}

export class LibrarySearchDto {
  @ValidateUUID({ optional: true })
  userId?: string;
}

export class ScanLibraryDto {
  @IsBoolean()
  @IsOptional()
  refreshModifiedFiles?: boolean;

  @IsBoolean()
  @IsOptional()
  refreshAllFiles?: boolean = false;
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
