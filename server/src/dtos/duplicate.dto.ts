import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { AssetResponseDto } from 'src/dtos/asset-response.dto';
import { Optional, ValidateBoolean, ValidateUUID } from 'src/validation';

export class DuplicateResponseDto {
  @ApiProperty({ description: 'Duplicate group ID' })
  duplicateId!: string;
  @ApiProperty({ description: 'Duplicate assets' })
  assets!: AssetResponseDto[];

  @ValidateUUID({ each: true, description: 'Suggested asset IDs to keep based on file size and EXIF data' })
  suggestedKeepAssetIds!: string[];
}

export class DuplicateSyncSettingsDto {
  @ValidateBoolean({
    description: 'Synchronize album membership across duplicate group',
    default: false,
    optional: true,
  })
  syncAlbums?: boolean;

  @ValidateBoolean({
    description: 'Synchronize visibility (archive/timeline) across duplicate group',
    default: false,
    optional: true,
  })
  syncVisibility?: boolean;

  @ValidateBoolean({
    description: 'Synchronize favorite status across duplicate group',
    default: false,
    optional: true,
  })
  syncFavorites?: boolean;

  @ValidateBoolean({
    description: 'Synchronize EXIF rating across duplicate group',
    default: false,
    optional: true,
  })
  syncRating?: boolean;

  @ValidateBoolean({
    description: 'Synchronize description across duplicate group',
    default: false,
    optional: true,
  })
  syncDescription?: boolean;

  @ValidateBoolean({
    description: 'Synchronize GPS location across duplicate group',
    default: false,
    optional: true,
  })
  syncLocation?: boolean;

  @ValidateBoolean({
    description: 'Synchronize tags across duplicate group',
    default: false,
    optional: true,
  })
  syncTags?: boolean;
}

export class DuplicateResolveGroupDto {
  @ValidateUUID()
  duplicateId!: string;

  @ValidateUUID({ each: true, description: 'Asset IDs to keep' })
  keepAssetIds!: string[];

  @ValidateUUID({ each: true, description: 'Asset IDs to trash or delete' })
  trashAssetIds!: string[];
}

export class DuplicateResolveDto {
  @ApiProperty({ description: 'List of duplicate groups to resolve' })
  @ValidateNested({ each: true })
  @IsArray()
  @Type(() => DuplicateResolveGroupDto)
  @ArrayMinSize(1)
  groups!: DuplicateResolveGroupDto[];

  @ApiProperty({ description: 'Settings for synchronization behavior' })
  @ValidateNested()
  @Optional()
  @Type(() => DuplicateSyncSettingsDto)
  settings?: DuplicateSyncSettingsDto;
}
