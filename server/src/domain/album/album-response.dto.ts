import { AlbumEntity } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';
import { AssetResponseDto, mapAsset } from '../asset';
import { mapUser, UserResponseDto } from '../user';

export class AlbumResponseDto {
  id!: string;
  ownerId!: string;
  albumName!: string;
  createdAt!: Date;
  updatedAt!: Date;
  albumThumbnailAssetId!: string | null;
  shared!: boolean;
  sharedUsers!: UserResponseDto[];
  assets!: AssetResponseDto[];
  owner!: UserResponseDto;
  @ApiProperty({ type: 'integer' })
  assetCount!: number;
}

export function mapAlbum(entity: AlbumEntity): AlbumResponseDto {
  const sharedUsers: UserResponseDto[] = [];

  entity.sharedUsers?.forEach((user) => {
    const userDto = mapUser(user);
    sharedUsers.push(userDto);
  });

  return {
    albumName: entity.albumName,
    albumThumbnailAssetId: entity.albumThumbnailAssetId,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    id: entity.id,
    ownerId: entity.ownerId,
    owner: mapUser(entity.owner),
    sharedUsers,
    shared: sharedUsers.length > 0 || entity.sharedLinks?.length > 0,
    assets: entity.assets?.map((asset) => mapAsset(asset)) || [],
    assetCount: entity.assets?.length || 0,
  };
}

export function mapAlbumExcludeAssetInfo(entity: AlbumEntity): AlbumResponseDto {
  const sharedUsers: UserResponseDto[] = [];

  entity.sharedUsers?.forEach((user) => {
    const userDto = mapUser(user);
    sharedUsers.push(userDto);
  });

  return {
    albumName: entity.albumName,
    albumThumbnailAssetId: entity.albumThumbnailAssetId,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    id: entity.id,
    ownerId: entity.ownerId,
    owner: mapUser(entity.owner),
    sharedUsers,
    shared: sharedUsers.length > 0 || entity.sharedLinks?.length > 0,
    assets: [],
    assetCount: entity.assets?.length || 0,
  };
}

export class AlbumCountResponseDto {
  @ApiProperty({ type: 'integer' })
  owned!: number;

  @ApiProperty({ type: 'integer' })
  shared!: number;

  @ApiProperty({ type: 'integer' })
  notShared!: number;
}
