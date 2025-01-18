import { Insertable, Selectable, Updateable } from 'kysely';
import { AlbumsSharedUsersUsers } from 'src/db';

export const IAlbumUserRepository = 'IAlbumUserRepository';

export type AlbumPermissionId = {
  albumsId: string;
  usersId: string;
};

export interface IAlbumUserRepository {
  create(albumUser: Insertable<AlbumsSharedUsersUsers>): Promise<Selectable<AlbumsSharedUsersUsers>>;
  update(
    id: AlbumPermissionId,
    albumPermission: Updateable<AlbumsSharedUsersUsers>,
  ): Promise<Selectable<AlbumsSharedUsersUsers>>;
  delete(id: AlbumPermissionId): Promise<void>;
}
