import { AlbumEntity } from '../../../../../../libs/database/src/entities/album.entity';
import { User, mapUser } from '../../user/response-dto/user';
import { AssetResponseDto, mapAsset } from '../../asset/response-dto/asset-response.dto';

export interface AlbumResponseDto {
  id: string;
  ownerId: string;
  albumName: string;
  createdAt: string;
  albumThumbnailAssetId: string | null;
  shared: boolean;
  sharedUsers: User[];
  assets: AssetResponseDto[];
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
  };
}
