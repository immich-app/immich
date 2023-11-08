import { AlbumEntity } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';
import { AssetResponseDto, mapAsset } from '../asset';
import { UserResponseDto, mapUser } from '../user';
import { ValidateUUID } from '../domain.util';
import { AlbumInfoAssetCount, AlbumPersonInfo } from '../repositories/album.repository';


export class AlbumResponseDto {
  id!: string;
  ownerId!: string;
  albumName!: string;
  description!: string;
  createdAt!: Date;
  updatedAt!: Date;
  albumThumbnailAssetId!: string | null;
  shared!: boolean;
  sharedUsers!: UserResponseDto[];
  hasSharedLink!: boolean;
  assets!: AssetResponseDto[];
  owner!: UserResponseDto;
  @ApiProperty({ type: 'integer' })
  assetCount!: number;
  lastModifiedAssetTimestamp?: Date;
  startDate?: Date;
  endDate?: Date;
  isActivityEnabled!: boolean;
}

export class AlbumsForPersonResponseDto {
  @ValidateUUID()
  albumId!: string;
  @ApiProperty({ type: 'string' })
  albumName!: string;
  @ValidateUUID()
  albumThumbnailAssetId!: string;
  @ApiProperty({ type: 'integer' })
  assetCount!: number;
}

export class PeopleForAlbumResponseDto {
  @ValidateUUID()
  personId!: string;
  @ApiProperty({ type: 'string' })
  personName!: string;
  @ApiProperty({ type: 'integer' })
  albumCount!: number;
}

export function mapPeopleInfo(entity: AlbumPersonInfo): PeopleForAlbumResponseDto {
  return {
    personId: entity.personId,
    personName: entity.personName,
    albumCount: entity.albumsCount,
  };
}

export function mapAlbumCount(entity: AlbumInfoAssetCount): AlbumsForPersonResponseDto {
  return {
    albumId: entity.albumId,
    albumName: entity.albumName,
    albumThumbnailAssetId: entity.albumThumbnailAssetId,
    assetCount: entity.assetCount,
  };
}

export const mapAlbum = (entity: AlbumEntity, withAssets: boolean): AlbumResponseDto => {
  const sharedUsers: UserResponseDto[] = [];

  entity.sharedUsers?.forEach((user) => {
    const userDto = mapUser(user);
    sharedUsers.push(userDto);
  });

  const assets = entity.assets || [];

  const hasSharedLink = entity.sharedLinks?.length > 0;
  const hasSharedUser = sharedUsers.length > 0;

  let startDate = assets.at(0)?.fileCreatedAt || undefined;
  let endDate = assets.at(-1)?.fileCreatedAt || undefined;
  // Swap dates if start date is greater than end date.
  if (startDate && endDate && startDate > endDate) {
    const temp = startDate;
    startDate = endDate;
    endDate = temp;
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
    shared: hasSharedUser || hasSharedLink,
    hasSharedLink,
    startDate,
    endDate,
    assets: (withAssets ? assets : []).map((asset) => mapAsset(asset)),
    assetCount: entity.assets?.length || 0,
    isActivityEnabled: entity.isActivityEnabled,
  };
};

export const mapAlbumWithAssets = (entity: AlbumEntity) => mapAlbum(entity, true);
export const mapAlbumWithoutAssets = (entity: AlbumEntity) => mapAlbum(entity, false);

export class AlbumCountResponseDto {
  @ApiProperty({ type: 'integer' })
  owned!: number;

  @ApiProperty({ type: 'integer' })
  shared!: number;

  @ApiProperty({ type: 'integer' })
  notShared!: number;
}
