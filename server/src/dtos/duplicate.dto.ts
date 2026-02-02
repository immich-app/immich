import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsBoolean, ValidateNested } from 'class-validator';
import { AssetResponseDto } from 'src/dtos/asset-response.dto';
import { ValidateUUID } from 'src/validation';

export class DuplicateResponseDto {
  @ApiProperty({ description: 'Duplicate group ID' })
  duplicateId!: string;
  @ApiProperty({ description: 'Duplicate assets' })
  assets!: AssetResponseDto[];

  @ApiProperty({
    description: 'Suggested asset IDs to keep based on file size and EXIF data',
    isArray: true,
    type: String,
  })
  suggestedKeepAssetIds!: string[];
}

// Resolve endpoint DTOs

export class DuplicateResolveSettingsDto {
  @ApiProperty({ type: Boolean, description: 'Synchronize album membership across duplicate group' })
  @IsBoolean()
  synchronizeAlbums!: boolean;

  @ApiProperty({ type: Boolean, description: 'Synchronize visibility (archive/timeline) across duplicate group' })
  @IsBoolean()
  synchronizeVisibility!: boolean;

  @ApiProperty({ type: Boolean, description: 'Synchronize favorite status across duplicate group' })
  @IsBoolean()
  synchronizeFavorites!: boolean;

  @ApiProperty({ type: Boolean, description: 'Synchronize EXIF rating across duplicate group' })
  @IsBoolean()
  synchronizeRating!: boolean;

  @ApiProperty({ type: Boolean, description: 'Synchronize description across duplicate group' })
  @IsBoolean()
  synchronizeDescription!: boolean;

  @ApiProperty({ type: Boolean, description: 'Synchronize GPS location across duplicate group' })
  @IsBoolean()
  synchronizeLocation!: boolean;

  @ApiProperty({ type: Boolean, description: 'Synchronize tags across duplicate group' })
  @IsBoolean()
  synchronizeTags!: boolean;
}

export class DuplicateResolveGroupDto {
  @ValidateUUID()
  duplicateId!: string;

  @ApiProperty({ isArray: true, type: String, description: 'Asset IDs to keep (will have duplicateId cleared)' })
  @ValidateUUID({ each: true })
  keepAssetIds!: string[];

  @ApiProperty({ isArray: true, type: String, description: 'Asset IDs to trash or delete' })
  @ValidateUUID({ each: true })
  trashAssetIds!: string[];
}

export class DuplicateResolveDto {
  @ApiProperty({ type: [DuplicateResolveGroupDto], description: 'List of duplicate groups to resolve' })
  @ValidateNested({ each: true })
  @Type(() => DuplicateResolveGroupDto)
  @ArrayMinSize(1)
  groups!: DuplicateResolveGroupDto[];

  @ApiProperty({ type: DuplicateResolveSettingsDto, description: 'Settings for synchronization behavior' })
  @ValidateNested()
  @Type(() => DuplicateResolveSettingsDto)
  settings!: DuplicateResolveSettingsDto;
}

export enum DuplicateResolveStatus {
  Success = 'SUCCESS',
  Failed = 'FAILED',
}

export class DuplicateResolveResultDto {
  @ApiProperty({ description: 'The duplicate group ID that was processed' })
  duplicateId!: string;

  @ApiProperty({ enum: DuplicateResolveStatus, description: 'Status of the resolve operation for this group' })
  status!: DuplicateResolveStatus;

  @ApiProperty({ required: false, description: 'Error reason if status is FAILED' })
  reason?: string;
}

export enum DuplicateResolveBatchStatus {
  Completed = 'COMPLETED',
}

export class DuplicateResolveResponseDto {
  @ApiProperty({ enum: DuplicateResolveBatchStatus, description: 'Overall status of the resolve operation' })
  status!: DuplicateResolveBatchStatus;

  @ApiProperty({ type: [DuplicateResolveResultDto], description: 'Per-group results of the resolve operation' })
  results!: DuplicateResolveResultDto[];
}
