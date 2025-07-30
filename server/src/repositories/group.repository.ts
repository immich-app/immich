import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, Updateable } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { columns } from 'src/database';
import { GenerateSql } from 'src/decorators';
import { GroupUserDto } from 'src/dtos/group-user.dto';
import { DB } from 'src/schema';
import { GroupTable } from 'src/schema/tables/group.table';

@Injectable()
export class GroupRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql()
  search(options: { id?: string; userId?: string } = {}) {
    const { id, userId } = options;
    return this.db
      .selectFrom('group')
      .select(['group.id', 'group.name', 'group.description', 'group.createdAt', 'group.updatedAt'])
      .$if(!!id, (eb) => eb.where('group.id', '=', id!))
      .$if(!!userId, (eb) =>
        eb.innerJoin('group_user', 'group_user.groupId', 'group.id').where('group_user.userId', '=', userId!),
      )
      .orderBy('group.name', 'asc')
      .execute();
  }

  create(group: Insertable<GroupTable>, users?: GroupUserDto[]) {
    return this.db.transaction().execute(async (tx) => {
      const newGroup = await tx
        .insertInto('group')
        .values(group)
        .returning(columns.groupAdmin)
        .executeTakeFirstOrThrow();

      const groupId = newGroup.id;

      if (users && users.length > 0) {
        await tx
          .insertInto('group_user')
          .values(users.map(({ userId }) => ({ groupId, userId })))
          .execute();
      }

      return newGroup;
    });
  }

  get(id: string) {
    return this.db.selectFrom('group').select(columns.groupAdmin).where('id', '=', id).executeTakeFirst();
  }

  update(id: string, group: Updateable<GroupTable>) {
    return this.db
      .updateTable('group')
      .set(group)
      .where('id', '=', id)
      .returning(columns.groupAdmin)
      .executeTakeFirstOrThrow();
  }

  delete(id: string) {
    return this.db.deleteFrom('group').where('id', '=', id).executeTakeFirstOrThrow();
  }
}
