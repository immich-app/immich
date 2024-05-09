import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsEnum, IsString, ValidateNested } from 'class-validator';
import _ from 'lodash';
import { PropertyLifecycle } from 'src/decorators';
import { AssetResponseDto, mapAsset } from 'src/dtos/asset-response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { UserResponseDto, mapUser } from 'src/dtos/user.dto';
import { AlbumUserRole } from 'src/entities/album-user.entity';
import { AlbumEntity, AssetOrder } from 'src/entities/album.entity';
import { Optional, ValidateBoolean, ValidateUUID } from 'src/validation';

export class AlbumInfoDto {
  @ValidateBoolean({ optional: true })
  withoutAssets?: boolean;
}

export class AlbumUserAddDto {
  @ValidateUUID()
  userId!: string;

  @IsEnum(AlbumUserRole)
  @ApiProperty({ enum: AlbumUserRole, enumName: 'AlbumUserRole', default: AlbumUserRole.EDITOR })
  role?: AlbumUserRole;
}

export class AddUsersDto {
  @ValidateUUID({ each: true, optional: true })
  @PropertyLifecycle({ deprecatedAt: 'v1.102.0' })
  sharedUserIds?: string[];

  @ArrayNotEmpty()
  albumUsers!: AlbumUserAddDto[];
}

class AlbumUserCreateDto {
  @ValidateUUID()
  userId!: string;

  @IsEnum(AlbumUserRole)
  @ApiProperty({ enum: AlbumUserRole, enumName: 'AlbumUserRole' })
  role!: AlbumUserRole;
}

export class CreateAlbumDto {
  @IsString()
  @ApiProperty()
  albumName!: string;

  @IsString()
  @Optional()
  description?: string;

  @Optional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AlbumUserCreateDto)
  @PropertyLifecycle({ addedAt: 'v1.104.0' })
  albumUsers?: AlbumUserCreateDto[];

  @ValidateUUID({ optional: true, each: true })
  @PropertyLifecycle({ deprecatedAt: 'v1.104.0' })
  sharedWithUserIds?: string[];

  @ValidateUUID({ optional: true, each: true })
  assetIds?: string[];
}

export class UpdateAlbumDto {
  @Optional()
  @IsString()
  albumName?: string;

  @Optional()
  @IsString()
  description?: string;

  @ValidateUUID({ optional: true })
  albumThumbnailAssetId?: string;

  @ValidateBoolean({ optional: true })
  isActivityEnabled?: boolean;

  @IsEnum(AssetOrder)
  @Optional()
  @ApiProperty({ enum: AssetOrder, enumName: 'AssetOrder' })
  order?: AssetOrder;
}

export class GetAlbumsDto {
  @ValidateBoolean({ optional: true })
  /**
   * true: only shared albums
   * false: only non-shared own albums
   * undefined: shared and owned albums
   */
  shared?: boolean;

  /**
   * Only returns albums that contain the asset
   * Ignores the shared parameter
   * undefined: get all albums
   */
  @ValidateUUID({ optional: true })
  assetId?: string;
}

export class AlbumCountResponseDto {
  @ApiProperty({ type: 'integer' })
  owned!: number;

  @ApiProperty({ type: 'integer' })
  shared!: number;

  @ApiProperty({ type: 'integer' })
  notShared!: number;
}

export class UpdateAlbumUserDto {
  @IsEnum(AlbumUserRole)
  @ApiProperty({ enum: AlbumUserRole, enumName: 'AlbumUserRole' })
  role!: AlbumUserRole;
}

export class AlbumUserResponseDto {
  user!: UserResponseDto;
  @ApiProperty({ enum: AlbumUserRole, enumName: 'AlbumUserRole' })
  role!: AlbumUserRole;
}

export class AlbumResponseDto {
  id!: string;
  ownerId!: string;
  albumName!: string;
  description!: string;
  createdAt!: Date;
  updatedAt!: Date;
  albumThumbnailAssetId!: string | null;
  shared!: boolean;
  @PropertyLifecycle({ deprecatedAt: 'v1.102.0' })
  sharedUsers!: UserResponseDto[];
  albumUsers!: AlbumUserResponseDto[];
  hasSharedLink!: boolean;
  assets!: AssetResponseDto[];
  owner!: UserResponseDto;
  @ApiProperty({ type: 'integer' })
  assetCount!: number;
  lastModifiedAssetTimestamp?: Date;
  startDate?: Date;
  endDate?: Date;
  isActivityEnabled!: boolean;
  @Optional()
  @ApiProperty({ enumName: 'AssetOrder', enum: AssetOrder })
  order?: AssetOrder;
}

export const mapAlbum = (entity: AlbumEntity, withAssets: boolean, auth?: AuthDto): AlbumResponseDto => {
  const sharedUsers: UserResponseDto[] = [];
  const albumUsers: AlbumUserResponseDto[] = [];

  if (entity.albumUsers) {
    for (const albumUser of entity.albumUsers) {
      const user = mapUser(albumUser.user);
      sharedUsers.push(user);
      albumUsers.push({
        user,
        role: albumUser.role,
      });
    }
  }

  const albumUsersSorted = _.orderBy(albumUsers, ['role', 'user.name']);

  const assets = entity.assets || [];

  const hasSharedLink = entity.sharedLinks?.length > 0;
  const hasSharedUser = sharedUsers.length > 0;

  let startDate = assets.at(0)?.fileCreatedAt || undefined;
  let endDate = assets.at(-1)?.fileCreatedAt || undefined;
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
    sharedUsers,
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

export const mapAlbumWithAssets = (entity: AlbumEntity) => mapAlbum(entity, true);
export const mapAlbumWithoutAssets = (entity: AlbumEntity) => mapAlbum(entity, false);
