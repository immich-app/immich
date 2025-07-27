import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, Updateable } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DummyValue, GenerateSql } from 'src/decorators';
import { AlbumUserRole } from 'src/enum';
import { DB } from 'src/schema';
import { AlbumUserTable } from 'src/schema/tables/album-user.table';

export type AlbumPermissionId = {
  albumsId: string;
  usersId: string;
};

@Injectable()
export class AlbumUserRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [{ usersId: DummyValue.UUID, albumsId: DummyValue.UUID }] })
  create(albumUser: Insertable<AlbumUserTable>) {
    return this.db
      .insertInto('album_user')
      .values(albumUser)
      .returning(['usersId', 'albumsId', 'role'])
      .executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [{ usersId: DummyValue.UUID, albumsId: DummyValue.UUID }, { role: AlbumUserRole.Viewer }] })
  update({ usersId, albumsId }: AlbumPermissionId, dto: Updateable<AlbumUserTable>) {
    return this.db
      .updateTable('album_user')
      .set(dto)
      .where('usersId', '=', usersId)
      .where('albumsId', '=', albumsId)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [{ usersId: DummyValue.UUID, albumsId: DummyValue.UUID }] })
  async delete({ usersId, albumsId }: AlbumPermissionId): Promise<void> {
    await this.db.deleteFrom('album_user').where('usersId', '=', usersId).where('albumsId', '=', albumsId).execute();
  }
}
