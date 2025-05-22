import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, Updateable } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { AlbumsSharedUsersUsers, DB } from 'src/db';
import { DummyValue, GenerateSql } from 'src/decorators';
import { AlbumUserRole } from 'src/enum';

export type AlbumPermissionId = {
  albumsId: string;
  usersId: string;
};

@Injectable()
export class AlbumUserRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [{ usersId: DummyValue.UUID, albumsId: DummyValue.UUID }] })
  create(albumUser: Insertable<AlbumsSharedUsersUsers>) {
    return this.db
      .insertInto('albums_shared_users_users')
      .values(albumUser)
      .returning(['usersId', 'albumsId', 'role'])
      .executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [{ usersId: DummyValue.UUID, albumsId: DummyValue.UUID }, { role: AlbumUserRole.VIEWER }] })
  update({ usersId, albumsId }: AlbumPermissionId, dto: Updateable<AlbumsSharedUsersUsers>) {
    return this.db
      .updateTable('albums_shared_users_users')
      .set(dto)
      .where('usersId', '=', usersId)
      .where('albumsId', '=', albumsId)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [{ usersId: DummyValue.UUID, albumsId: DummyValue.UUID }] })
  async delete({ usersId, albumsId }: AlbumPermissionId): Promise<void> {
    await this.db
      .deleteFrom('albums_shared_users_users')
      .where('usersId', '=', usersId)
      .where('albumsId', '=', albumsId)
      .execute();
  }
}
