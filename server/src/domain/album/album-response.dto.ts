import { AlbumEntity } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';
import { AssetResponseDto, mapAsset } from '../asset';
import { mapUser, UserResponseDto } from '../user';

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
  assets!: AssetResponseDto[];
  owner!: UserResponseDto;
  @ApiProperty({ type: 'integer' })
  assetCount!: number;
  lastModifiedAssetTimestamp?: Date;
}

const _map = (entity: AlbumEntity, withAssets: boolean): AlbumResponseDto => {
  const sharedUsers: UserResponseDto[] = [];

  entity.sharedUsers?.forEach((user) => {
    const userDto = mapUser(user);
    sharedUsers.push(userDto);
  });

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
    shared: sharedUsers.length > 0 || entity.sharedLinks?.length > 0,
    assets: withAssets ? entity.assets?.map((asset) => mapAsset(asset)) || [] : [],
    assetCount: entity.assets?.length || 0,
  };
};

export const mapAlbum = (entity: AlbumEntity) => _map(entity, true);
export const mapAlbumExcludeAssetInfo = (entity: AlbumEntity) => _map(entity, false);

export class AlbumCountResponseDto {
  @ApiProperty({ type: 'integer' })
  owned!: number;

  @ApiProperty({ type: 'integer' })
  shared!: number;

  @ApiProperty({ type: 'integer' })
  notShared!: number;
}
