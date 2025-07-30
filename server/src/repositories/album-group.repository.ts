import { Injectable } from '@nestjs/common';
import { Kysely, NotNull, Updateable } from 'kysely';
import { jsonObjectFrom } from 'kysely/helpers/postgres';
import { InjectKysely } from 'nestjs-kysely';
import { Chunked, DummyValue, GenerateSql } from 'src/decorators';
import { AlbumGroupDto } from 'src/dtos/album-group.dto';
import { AlbumUserRole } from 'src/enum';
import { DB } from 'src/schema';
import { AlbumGroupTable } from 'src/schema/tables/album-group.table';

type AlbumGroup = { albumId: string; groupId: string };

@Injectable()
export class AlbumGroupRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID] })
  getAll(albumId: string) {
    return this.db
      .selectFrom('album_group')
      .where('albumId', '=', albumId)
      .innerJoin('group', 'album_group.groupId', 'group.id')
      .orderBy('group.name')
      .select((eb) =>
        jsonObjectFrom(
          eb
            .selectFrom('group')
            .select(['group.id', 'group.name', 'group.description'])
            .whereRef('group.id', '=', 'album_group.groupId'),
        ).as('group'),
      )
      .$narrowType<{ group: NotNull }>()
      .select(['album_group.createdAt', 'album_group.updatedAt'])
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, [{ groupId: DummyValue.UUID, role: DummyValue.STRING }]] })
  @Chunked({ paramIndex: 1 })
  createAll(albumId: string, groups: AlbumGroupDto[]) {
    return this.db
      .insertInto('album_group')
      .values(groups.map(({ groupId, role }) => ({ albumId, groupId, role: role ?? AlbumUserRole.Editor })))
      .onConflict((oc) =>
        oc.columns(['albumId', 'groupId']).doUpdateSet((eb) => ({
          role: eb.ref('excluded.role'),
        })),
      )
      .returning(['createdAt', 'updatedAt'])
      .returning((eb) =>
        jsonObjectFrom(
          eb.selectFrom('group').whereRef('album_group.groupId', '=', 'group.id').select(['id', 'name', 'description']),
        ).as('group'),
      )
      .$narrowType<{ group: NotNull }>()
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, [DummyValue.UUID]] })
  @Chunked({ paramIndex: 1 })
  deleteAll(albumId: string, groupIds: string[]) {
    if (groupIds.length === 0) {
      return Promise.resolve();
    }
    return this.db.deleteFrom('album_group').where('albumId', '=', albumId).where('groupId', 'in', groupIds).execute();
  }

  async exists({ albumId, groupId }: AlbumGroup) {
    const albumGroup = await this.db
      .selectFrom('album_group')
      .select(['albumId'])
      .where('albumId', '=', albumId)
      .where('groupId', '=', groupId)
      .execute();

    return !!albumGroup;
  }

  @GenerateSql({ params: [{ albumId: DummyValue.UUID, groupId: DummyValue.UUID }, { role: DummyValue.STRING }] })
  update({ albumId, groupId }: AlbumGroup, dto: Updateable<AlbumGroupTable>) {
    return this.db
      .updateTable('album_group')
      .set(dto)
      .where('albumId', '=', albumId)
      .where('groupId', '=', groupId)
      .returning(['createdAt', 'updatedAt'])
      .returning((eb) =>
        jsonObjectFrom(
          eb.selectFrom('group').whereRef('album_group.groupId', '=', 'group.id').select(['id', 'name', 'description']),
        ).as('group'),
      )
      .$narrowType<{ group: NotNull }>()
      .executeTakeFirstOrThrow();
  }

  delete({ albumId, groupId }: AlbumGroup) {
    return this.db.deleteFrom('album_group').where('albumId', '=', albumId).where('groupId', '=', groupId).execute();
  }
}
