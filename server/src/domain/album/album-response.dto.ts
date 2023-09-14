import { AlbumEntity } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';
import { AssetResponseDto, mapAsset } from '../asset';
import { UserResponseDto, mapUser } from '../user';

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
    startDate: assets.at(0)?.fileCreatedAt || undefined,
    endDate: assets.at(-1)?.fileCreatedAt || undefined,
    assets: (withAssets ? assets : []).map((asset) => mapAsset(asset)),
    assetCount: entity.assets?.length || 0,
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
