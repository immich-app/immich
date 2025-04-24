import { Insertable, Kysely, Updateable } from 'kysely';
import { DateTime } from 'luxon';
import { InjectKysely } from 'nestjs-kysely';
import { columns } from 'src/database';
import { DB, Notifications } from 'src/db';
import { DummyValue, GenerateSql } from 'src/decorators';
import { NotificationSearchDto } from 'src/dtos/notification.dto';

export class NotificationRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID] })
  cleanup() {
    return this.db
      .deleteFrom('notifications')
      .where((eb) =>
        eb.or([
          // remove soft-deleted notifications
          eb.and([eb('deletedAt', 'is not', null), eb('deletedAt', '<', DateTime.now().minus({ days: 3 }).toJSDate())]),

          // remove old, read notifications
          eb.and([
            // keep recently read messages around for a few days
            eb('readAt', '>', DateTime.now().minus({ days: 2 }).toJSDate()),
            eb('createdAt', '<', DateTime.now().minus({ days: 15 }).toJSDate()),
          ]),

          eb.and([
            // remove super old, unread notifications
            eb('readAt', '=', null),
            eb('createdAt', '<', DateTime.now().minus({ days: 30 }).toJSDate()),
          ]),
        ]),
      )
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, {}] }, { name: 'unread', params: [DummyValue.UUID, { unread: true }] })
  search(userId: string, dto: NotificationSearchDto) {
    return this.db
      .selectFrom('notifications')
      .select(columns.notification)
      .where((qb) =>
        qb.and({
          userId,
          id: dto.id,
          level: dto.level,
          type: dto.type,
          readAt: dto.unread ? null : undefined,
        }),
      )
      .where('deletedAt', 'is', null)
      .orderBy('createdAt', 'desc')
      .execute();
  }

  create(notification: Insertable<Notifications>) {
    return this.db
      .insertInto('notifications')
      .values(notification)
      .returning(columns.notification)
      .executeTakeFirstOrThrow();
  }

  get(id: string) {
    return this.db
      .selectFrom('notifications')
      .select(columns.notification)
      .where('id', '=', id)
      .where('deletedAt', 'is not', null)
      .executeTakeFirst();
  }

  update(id: string, notification: Updateable<Notifications>) {
    return this.db
      .updateTable('notifications')
      .set(notification)
      .where('deletedAt', 'is', null)
      .where('id', '=', id)
      .returning(columns.notification)
      .executeTakeFirstOrThrow();
  }

  async updateAll(ids: string[], notification: Updateable<Notifications>) {
    await this.db.updateTable('notifications').set(notification).where('id', 'in', ids).execute();
  }

  async delete(id: string) {
    await this.db
      .updateTable('notifications')
      .set({ deletedAt: DateTime.now().toJSDate() })
      .where('id', '=', id)
      .execute();
  }

  async deleteAll(ids: string[]) {
    await this.db
      .updateTable('notifications')
      .set({ deletedAt: DateTime.now().toJSDate() })
      .where('id', 'in', ids)
      .execute();
  }
}
