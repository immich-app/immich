import { AlbumEntity } from '../../../../../../libs/database/src/entities/album.entity';
import { UserResponseDto, mapUser } from '../../user/response-dto/user-response.dto';
import { AssetResponseDto, mapAsset } from '../../asset/response-dto/asset-response.dto';
import { ApiProperty } from '@nestjs/swagger';

export class AlbumResponseDto {
  id!: string;
  ownerId!: string;
  albumName!: string;
  createdAt!: string;
  albumThumbnailAssetId!: string | null;
  shared!: boolean;
  sharedUsers!: UserResponseDto[];
  assets!: AssetResponseDto[];

  @ApiProperty({ type: 'integer' })
  assetCount!: number;
}

export function mapAlbum(entity: AlbumEntity): AlbumResponseDto {
  const sharedUsers = entity.sharedUsers?.map((userAlbum) => mapUser(userAlbum.userInfo)) || [];
  return {
    albumName: entity.albumName,
    albumThumbnailAssetId: entity.albumThumbnailAssetId,
    createdAt: entity.createdAt,
    id: entity.id,
    ownerId: entity.ownerId,
    sharedUsers,
    shared: sharedUsers.length > 0,
    assets: entity.assets?.map((assetAlbum) => mapAsset(assetAlbum.assetInfo)) || [],
    assetCount: entity.assets?.length || 0,
  };
}

export function mapAlbumExcludeAssetInfo(entity: AlbumEntity): AlbumResponseDto {
  const sharedUsers = entity.sharedUsers?.map((userAlbum) => mapUser(userAlbum.userInfo)) || [];
  return {
    albumName: entity.albumName,
    albumThumbnailAssetId: entity.albumThumbnailAssetId,
    createdAt: entity.createdAt,
    id: entity.id,
    ownerId: entity.ownerId,
    sharedUsers,
    shared: sharedUsers.length > 0,
    assets: [],
    assetCount: entity.assets?.length || 0,
  };
}
