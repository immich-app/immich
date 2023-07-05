import { LibraryEntity, LibraryType } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ValidateUUID } from '../domain.util';

export class CreateLibraryDto {
  @IsEnum(LibraryType)
  @IsNotEmpty()
  @ApiProperty({ enumName: 'LibraryType', enum: LibraryType })
  libraryType!: LibraryType;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}

export class CrawlOptionsDto {
  pathsToCrawl!: string[];
  recursive? = false;
  includeHidden? = false;
  excludePatterns?: string[];
}

export class GetLibrariesDto {
  /**
   * Only returns albums that contain the asset
   * undefined: get all albums
   */
  @ValidateUUID({ optional: true })
  assetId?: string;
}

export class LibrarySearchDto {
  @ValidateUUID({ optional: true })
  userId?: string;
}

export class ScanLibraryDto {
  // Forces all files to be re-read no matter the timestamp
  @IsBoolean()
  @IsOptional()
  forceRefresh?: boolean = false;
}

export class LibraryResponseDto {
  id!: string;
  ownerId!: string;
  name!: string;

  @ApiProperty({ enumName: 'LibraryType', enum: LibraryType })
  type!: LibraryType;

  @ApiProperty({ type: 'integer' })
  assetCount!: number;

  createdAt!: Date;
  updatedAt!: Date;
  refreshedAt?: Date;
}

export function mapLibrary(entity: LibraryEntity): LibraryResponseDto {
  return {
    id: entity.id,
    ownerId: entity.ownerId,
    type: entity.type,
    name: entity.name,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    refreshedAt: entity.refreshedAt,
    assetCount: entity.assets.length,
  };
}
