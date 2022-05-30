import { AlbumEntity } from '../entities/album.entity';
import { mapUser } from '../../user/response-dto/user';
import { mapAsset } from '../../asset/response-dto/asset';
import { Asset } from '../../asset/response-dto/asset';
import { User } from '../../user/response-dto/user';

export interface Album {
  id: string;
  ownerId: string;
  albumName: string;
  createdAt: string;
  albumThumbnailAssetId: string | null;
  shared: boolean;
  sharedUsers: User[];
  sharedAssets: Asset[];
}

export function mapAlbum(entity: AlbumEntity): Album {
  const sharedUsers = entity.sharedUsers?.map((userAlbum) => mapUser(userAlbum.userInfo)) || [];
  return {
    albumName: entity.albumName,
    albumThumbnailAssetId: entity.albumThumbnailAssetId,
    createdAt: entity.createdAt,
    id: entity.id,
    ownerId: entity.ownerId,
    sharedUsers,
    shared: sharedUsers.length > 0,
    sharedAssets: entity.sharedAssets?.map((assetAlbum) => mapAsset(assetAlbum.assetInfo)) || [],
  };
}
