import { LibraryEntity, LibraryType } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ValidateUUID } from '../domain.util';

export class CreateLibraryDto {
  @IsEnum(LibraryType)
  @IsNotEmpty()
  @ApiProperty({ enumName: 'LibraryType', enum: LibraryType })
  type!: LibraryType;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @IsOptional()
  @IsString({ each: true })
  importPaths!: string[];

  @IsOptional()
  @IsString({ each: true })
  excludePatterns!: string[];
}

export class UpdateLibraryDto {
  @ValidateUUID()
  id!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @IsOptional()
  @IsString({ each: true })
  importPaths!: string[];

  @IsOptional()
  @IsString({ each: true })
  excludePatterns!: string[];
}

export class CrawlOptionsDto {
  pathsToCrawl!: string[];
  includeHidden? = false;
  excludePatterns?: string[];
}

export class GetLibrariesDto {
  @ValidateUUID({ optional: true })
  assetId?: string;
}

export class LibrarySearchDto {
  @ValidateUUID({ optional: true })
  userId?: string;
}

export class ScanLibraryDto {
  @IsBoolean()
  @IsOptional()
  analyze?: boolean = false;

  @IsBoolean()
  @IsOptional()
  emptyTrash?: boolean = false;
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

  excludePatterns!: string[];

  createdAt!: Date;
  updatedAt!: Date;
  refreshedAt?: Date | null;
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
    assetCount: assetCount,
    importPaths: entity.importPaths,
    excludePatterns: entity.exclusionPatterns,
  };
}
