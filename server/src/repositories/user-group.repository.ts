import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, Updateable } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DummyValue, GenerateSql } from 'src/decorators';
import { DB } from 'src/schema';
import { UserGroupTable } from 'src/schema/tables/user-group.table';

@Injectable()
export class UserGroupRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID] })
  getById(id: string) {
    return this.db.selectFrom('user_group').selectAll().where('id', '=', id).executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getAllByUserId(userId: string) {
    return this.db
      .selectFrom('user_group')
      .selectAll()
      .where('createdById', '=', userId)
      .orderBy('name', 'asc')
      .execute();
  }

  create(values: Insertable<UserGroupTable>) {
    return this.db.insertInto('user_group').values(values).returningAll().executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID, { name: 'Updated Group' }] })
  update(id: string, values: Updateable<UserGroupTable>) {
    return this.db.updateTable('user_group').set(values).where('id', '=', id).returningAll().executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async remove(id: string) {
    await this.db.deleteFrom('user_group').where('id', '=', id).execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getMembers(groupId: string) {
    return this.db
      .selectFrom('user_group_member')
      .innerJoin('user', (join) =>
        join.onRef('user.id', '=', 'user_group_member.userId').on('user.deletedAt', 'is', null),
      )
      .where('user_group_member.groupId', '=', groupId)
      .select([
        'user_group_member.groupId',
        'user_group_member.userId',
        'user_group_member.addedAt',
        'user.name',
        'user.email',
        'user.profileImagePath',
        'user.profileChangedAt',
        'user.avatarColor',
      ])
      .execute();
  }

  async setMembers(groupId: string, userIds: string[]) {
    await this.db.transaction().execute(async (trx) => {
      await trx.deleteFrom('user_group_member').where('groupId', '=', groupId).execute();

      if (userIds.length === 0) {
        return;
      }

      await trx
        .insertInto('user_group_member')
        .values(userIds.map((userId) => ({ groupId, userId })))
        .execute();
    });
  }
}
