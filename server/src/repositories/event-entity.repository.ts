import { Injectable } from '@nestjs/common';
import { ExpressionBuilder, Insertable, Kysely, sql, Updateable } from 'kysely';
import { jsonObjectFrom } from 'kysely/helpers/postgres';
import { InjectKysely } from 'nestjs-kysely';
import { columns } from 'src/database';
import { Chunked, DummyValue, GenerateSql } from 'src/decorators';
import { DB } from 'src/schema';
import { EventTable } from 'src/schema/tables/event.table';

const withOwner = (eb: ExpressionBuilder<DB, 'event'>) => {
  return jsonObjectFrom(eb.selectFrom('user').select(columns.user).whereRef('user.id', '=', 'event.ownerId'))
    .$notNull()
    .as('owner');
};

@Injectable()
export class EventEntityRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID] })
  async getById(id: string) {
    const event = await this.db
      .selectFrom('event')
      .selectAll('event')
      .where('event.id', '=', id)
      .where('event.deletedAt', 'is', null)
      .select(withOwner)
      .select((eb) =>
        eb
          .selectFrom('album')
          .select((eb) => eb.fn.count<number>('album.id').as('albumCount'))
          .whereRef('album.eventId', '=', 'event.id')
          .where('album.deletedAt', 'is', null)
          .as('albumCount'),
      )
      .executeTakeFirst();

    return event;
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async getByIds(ids: string[]) {
    return this.db
      .selectFrom('event')
      .selectAll('event')
      .where('event.id', 'in', ids)
      .where('event.deletedAt', 'is', null)
      .select(withOwner)
      .select((eb) =>
        eb
          .selectFrom('album')
          .select((eb) => eb.fn.count<number>('album.id').as('albumCount'))
          .whereRef('album.eventId', '=', 'event.id')
          .where('album.deletedAt', 'is', null)
          .as('albumCount'),
      )
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async getOwned(ownerId: string) {
    return this.db
      .selectFrom('event')
      .selectAll('event')
      .where('event.ownerId', '=', ownerId)
      .where('event.deletedAt', 'is', null)
      .select(withOwner)
      .select((eb) =>
        eb
          .selectFrom('album')
          .select((eb) => eb.fn.count<number>('album.id').as('albumCount'))
          .whereRef('album.eventId', '=', 'event.id')
          .where('album.deletedAt', 'is', null)
          .as('albumCount'),
      )
      .orderBy('event.createdAt', 'desc')
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async getAllAccessible(userId: string) {
    // Get events that are either owned by the user OR have albums shared with the user
    return this.db
      .selectFrom('event')
      .selectAll('event')
      .where('event.deletedAt', 'is', null)
      .where((eb) =>
        eb.or([
          // User owns the event
          eb('event.ownerId', '=', userId),
          // User has access to albums in this event
          eb.exists((eb) =>
            eb
              .selectFrom('album')
              .innerJoin('album_user', 'album_user.albumId', 'album.id')
              .whereRef('album.eventId', '=', 'event.id')
              .where('album.deletedAt', 'is', null)
              .where('album_user.userId', '=', userId)
              .select(sql`1`.as('exists')),
          ),
        ]),
      )
      .select(withOwner)
      .select((eb) =>
        eb
          .selectFrom('album')
          .select((eb) => eb.fn.count<number>('album.id').as('albumCount'))
          .whereRef('album.eventId', '=', 'event.id')
          .where('album.deletedAt', 'is', null)
          .as('albumCount'),
      )
      .orderBy('event.createdAt', 'desc')
      .execute();
  }

  @GenerateSql({ params: [{ eventName: DummyValue.STRING, ownerId: DummyValue.UUID, description: DummyValue.STRING }] })
  async create(event: Insertable<EventTable>) {
    const created = await this.db.insertInto('event').values(event).returningAll().executeTakeFirstOrThrow();

    return this.getById(created.id);
  }

  @GenerateSql({ params: [DummyValue.UUID, { eventName: DummyValue.STRING }] })
  async update(id: string, event: Updateable<EventTable>) {
    await this.db.updateTable('event').set(event).where('event.id', '=', id).execute();

    return this.getById(id);
  }

  @Chunked()
  async delete(ids: string[]): Promise<void> {
    await this.db
      .updateTable('event')
      .set({ deletedAt: sql`clock_timestamp()` })
      .where('event.id', 'in', ids)
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async getStatistics(ownerId: string) {
    const statistics = await this.db
      .selectFrom('event')
      .select((eb) => eb.fn.count<number>('event.id').as('owned'))
      .where('event.ownerId', '=', ownerId)
      .where('event.deletedAt', 'is', null)
      .executeTakeFirst();

    return {
      owned: statistics?.owned || 0,
    };
  }
}
