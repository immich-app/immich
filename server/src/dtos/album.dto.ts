import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsString, ValidateNested } from 'class-validator';
import _ from 'lodash';
import { AlbumUser, AuthSharedLink, User } from 'src/database';
import { BulkIdErrorReason } from 'src/dtos/asset-ids.response.dto';
import { AssetResponseDto, MapAsset, mapAsset } from 'src/dtos/asset-response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { UserResponseDto, mapUser } from 'src/dtos/user.dto';
import { AlbumUserRole, AssetOrder } from 'src/enum';
import { Optional, ValidateBoolean, ValidateEnum, ValidateUUID } from 'src/validation';

export class AlbumInfoDto {
  @ValidateBoolean({ optional: true, description: 'Exclude assets from response' })
  withoutAssets?: boolean;
}

export class AlbumUserAddDto {
  @ValidateUUID({ description: 'User ID' })
  userId!: string;

  @ValidateEnum({
    enum: AlbumUserRole,
    name: 'AlbumUserRole',
    description: 'Album user role',
    default: AlbumUserRole.Editor,
  })
  role?: AlbumUserRole;
}

export class AddUsersDto {
  @ApiProperty({ description: 'Album users to add' })
  @ArrayNotEmpty()
  albumUsers!: AlbumUserAddDto[];
}

export class AlbumUserCreateDto {
  @ValidateUUID({ description: 'User ID' })
  userId!: string;

  @ValidateEnum({ enum: AlbumUserRole, name: 'AlbumUserRole', description: 'Album user role' })
  role!: AlbumUserRole;
}

export class CreateAlbumDto {
  @ApiProperty({ description: 'Album name' })
  @IsString()
  albumName!: string;

  @ApiPropertyOptional({ description: 'Album description' })
  @IsString()
  @Optional()
  description?: string;

  @ApiPropertyOptional({ description: 'Album users' })
  @Optional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AlbumUserCreateDto)
  albumUsers?: AlbumUserCreateDto[];

  @ValidateUUID({ optional: true, each: true, description: 'Initial asset IDs' })
  assetIds?: string[];
}

export class AlbumsAddAssetsDto {
  @ValidateUUID({ each: true, description: 'Album IDs' })
  albumIds!: string[];

  @ValidateUUID({ each: true, description: 'Asset IDs' })
  assetIds!: string[];
}

export class AlbumsAddAssetsResponseDto {
  @ApiProperty({ description: 'Operation success' })
  success!: boolean;
  @ValidateEnum({ enum: BulkIdErrorReason, name: 'BulkIdErrorReason', description: 'Error reason', optional: true })
  error?: BulkIdErrorReason;
}

export class UpdateAlbumDto {
  @ApiPropertyOptional({ description: 'Album name' })
  @Optional()
  @IsString()
  albumName?: string;

  @ApiPropertyOptional({ description: 'Album description' })
  @Optional()
  @IsString()
  description?: string;

  @ValidateUUID({ optional: true, description: 'Album thumbnail asset ID' })
  albumThumbnailAssetId?: string;

  @ValidateBoolean({ optional: true, description: 'Enable activity feed' })
  isActivityEnabled?: boolean;

  @ValidateEnum({ enum: AssetOrder, name: 'AssetOrder', description: 'Asset sort order', optional: true })
  order?: AssetOrder;
}

export class GetAlbumsDto {
  @ValidateBoolean({
    optional: true,
    description: 'Filter by shared status: true = only shared, false = not shared, undefined = all owned albums',
  })
  shared?: boolean;

  @ValidateUUID({ optional: true, description: 'Filter albums containing this asset ID (ignores shared parameter)' })
  assetId?: string;
}

export class AlbumStatisticsResponseDto {
  @ApiProperty({ type: 'integer', description: 'Number of owned albums' })
  owned!: number;

  @ApiProperty({ type: 'integer', description: 'Number of shared albums' })
  shared!: number;

  @ApiProperty({ type: 'integer', description: 'Number of non-shared albums' })
  notShared!: number;
}

export class UpdateAlbumUserDto {
  @ValidateEnum({ enum: AlbumUserRole, name: 'AlbumUserRole', description: 'Album user role' })
  role!: AlbumUserRole;
}

export class AlbumUserResponseDto {
  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  user!: UserResponseDto;
  @ValidateEnum({ enum: AlbumUserRole, name: 'AlbumUserRole', description: 'Album user role' })
  role!: AlbumUserRole;
}

export class ContributorCountResponseDto {
  @ApiProperty({ description: 'User ID' })
  userId!: string;

  @ApiProperty({ type: 'integer', description: 'Number of assets contributed' })
  assetCount!: number;
}

export class AlbumResponseDto {
  @ApiProperty({ description: 'Album ID' })
  id!: string;
  @ApiProperty({ description: 'Owner user ID' })
  ownerId!: string;
  @ApiProperty({ description: 'Album name' })
  albumName!: string;
  @ApiProperty({ description: 'Album description' })
  description!: string;
  @ApiProperty({ description: 'Creation date' })
  createdAt!: Date;
  @ApiProperty({ description: 'Last update date' })
  updatedAt!: Date;
  @ApiProperty({ description: 'Thumbnail asset ID' })
  albumThumbnailAssetId!: string | null;
  @ApiProperty({ description: 'Is shared album' })
  shared!: boolean;
  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  albumUsers!: AlbumUserResponseDto[];
  @ApiProperty({ description: 'Has shared link' })
  hasSharedLink!: boolean;
  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  assets!: AssetResponseDto[];
  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  owner!: UserResponseDto;
  @ApiProperty({ type: 'integer', description: 'Number of assets' })
  assetCount!: number;
  @ApiPropertyOptional({ description: 'Last modified asset timestamp' })
  lastModifiedAssetTimestamp?: Date;
  @ApiPropertyOptional({ description: 'Start date (earliest asset)' })
  startDate?: Date;
  @ApiPropertyOptional({ description: 'End date (latest asset)' })
  endDate?: Date;
  @ApiProperty({ description: 'Activity feed enabled' })
  isActivityEnabled!: boolean;
  @ValidateEnum({ enum: AssetOrder, name: 'AssetOrder', description: 'Asset sort order', optional: true })
  order?: AssetOrder;

  // Description lives on schema to avoid duplication
  @ApiPropertyOptional({ description: undefined })
  @Type(() => ContributorCountResponseDto)
  contributorCounts?: ContributorCountResponseDto[];
}

export type MapAlbumDto = {
  albumUsers?: AlbumUser[];
  assets?: MapAsset[];
  sharedLinks?: AuthSharedLink[];
  albumName: string;
  description: string;
  albumThumbnailAssetId: string | null;
  createdAt: Date;
  updatedAt: Date;
  id: string;
  ownerId: string;
  owner: User;
  isActivityEnabled: boolean;
  order: AssetOrder;
};

export const mapAlbum = (entity: MapAlbumDto, withAssets: boolean, auth?: AuthDto): AlbumResponseDto => {
  const albumUsers: AlbumUserResponseDto[] = [];

  if (entity.albumUsers) {
    for (const albumUser of entity.albumUsers) {
      const user = mapUser(albumUser.user);
      albumUsers.push({
        user,
        role: albumUser.role,
      });
    }
  }

  const albumUsersSorted = _.orderBy(albumUsers, ['role', 'user.name']);

  const assets = entity.assets || [];

  const hasSharedLink = !!entity.sharedLinks && entity.sharedLinks.length > 0;
  const hasSharedUser = albumUsers.length > 0;

  let startDate = assets.at(0)?.localDateTime;
  let endDate = assets.at(-1)?.localDateTime;
  // Swap dates if start date is greater than end date.
  if (startDate && endDate && startDate > endDate) {
    [startDate, endDate] = [endDate, startDate];
  }

  return {
    albumName: entity.albumName,
    description: entity.description,
    albumThumbnailAssetId: entity.albumThumbnailAssetId,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    id: entity.id,
    ownerId: entity.ownerId,
    owner: mapUser(entity.owner),
    albumUsers: albumUsersSorted,
    shared: hasSharedUser || hasSharedLink,
    hasSharedLink,
    startDate,
    endDate,
    assets: (withAssets ? assets : []).map((asset) => mapAsset(asset, { auth })),
    assetCount: entity.assets?.length || 0,
    isActivityEnabled: entity.isActivityEnabled,
    order: entity.order,
  };
};

export const mapAlbumWithAssets = (entity: MapAlbumDto) => mapAlbum(entity, true);
export const mapAlbumWithoutAssets = (entity: MapAlbumDto) => mapAlbum(entity, false);
