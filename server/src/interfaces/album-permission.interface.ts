import { AlbumPermissionEntity } from 'src/entities/album-permission.entity';

export const IAlbumPermissionRepository = 'IAlbumPermissionRepository';

export interface IAlbumPermissionRepository {
  create(albumPermission: Partial<AlbumPermissionEntity>): Promise<AlbumPermissionEntity>;
  update(
    userId: string,
    albumId: string,
    albumPermission: Partial<AlbumPermissionEntity>,
  ): Promise<AlbumPermissionEntity>;
  delete(userId: string, albumId: string): Promise<void>;
}
