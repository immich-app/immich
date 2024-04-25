import { AlbumUserEntity } from 'src/entities/album-user.entity';

export const IAlbumUserRepository = 'IAlbumUserRepository';

export type AlbumPermissionId = {
  albumId: string;
  userId: string;
};

export interface IAlbumUserRepository {
  create(albumUser: Partial<AlbumUserEntity>): Promise<AlbumUserEntity>;
  update({ userId, albumId }: AlbumPermissionId, albumPermission: Partial<AlbumUserEntity>): Promise<AlbumUserEntity>;
  delete({ userId, albumId }: AlbumPermissionId): Promise<void>;
}
