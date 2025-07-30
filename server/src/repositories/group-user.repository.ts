import { Injectable } from '@nestjs/common';
import { Kysely, NotNull } from 'kysely';
import { jsonObjectFrom } from 'kysely/helpers/postgres';
import { InjectKysely } from 'nestjs-kysely';
import { columns } from 'src/database';
import { Chunked, DummyValue, GenerateSql } from 'src/decorators';
import { DB } from 'src/schema';

type GroupUser = { groupId: string; userId: string };

@Injectable()
export class GroupUserRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID] })
  getAll(groupId: string) {
    return this.db
      .selectFrom('group_user')
      .where('groupId', '=', groupId)
      .innerJoin('user', 'group_user.userId', 'user.id')
      .orderBy('user.name', 'asc')
      .select((eb) =>
        jsonObjectFrom(
          eb.selectFrom('user as user2').select(columns.userWithPrefix).whereRef('user2.id', '=', 'group_user.userId'),
        ).as('user'),
      )
      .$narrowType<{ user: NotNull }>()
      .select(['group_user.createdAt', 'group_user.updatedAt'])
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, [DummyValue.UUID]] })
  @Chunked({ paramIndex: 1 })
  createAll(groupId: string, userIds: string[]) {
    return this.db
      .insertInto('group_user')
      .values(userIds.map((userId) => ({ userId, groupId })))
      .onConflict((oc) => oc.doNothing())
      .returning(['createdAt', 'updatedAt'])
      .returning((eb) =>
        jsonObjectFrom(
          eb.selectFrom('user as user2').whereRef('group_user.userId', '=', 'user2.id').select(columns.userWithPrefix),
        ).as('user'),
      )
      .$narrowType<{ user: NotNull }>()
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, [DummyValue.UUID]] })
  @Chunked({ paramIndex: 1 })
  deleteAll(groupId: string, usersIds: string[]) {
    if (usersIds.length === 0) {
      return Promise.resolve();
    }
    return this.db.deleteFrom('group_user').where('groupId', '=', groupId).where('userId', 'in', usersIds).execute();
  }

  get({ groupId, userId }: GroupUser) {
    return this.db
      .selectFrom('group_user')
      .innerJoin('group', 'group.id', 'group_user.groupId')
      .select(['group.id', 'group.name', 'group.description'])
      .where('group_user.groupId', '=', groupId)
      .where('group_user.userId', '=', userId)
      .execute();
  }

  delete({ userId, groupId }: GroupUser) {
    return this.db.deleteFrom('group_user').where('userId', '=', userId).where('groupId', '=', groupId).execute();
  }
}
