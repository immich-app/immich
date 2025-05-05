import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, NotNull, sql } from 'kysely';
import { jsonObjectFrom } from 'kysely/helpers/postgres';
import { InjectKysely } from 'nestjs-kysely';
import { columns } from 'src/database';
import { Activity, DB } from 'src/db';
import { DummyValue, GenerateSql } from 'src/decorators';
import { asUuid } from 'src/utils/database';

export interface ActivitySearch {
  albumId?: string;
  assetId?: string | null;
  userId?: string;
  isLiked?: boolean;
}

@Injectable()
export class ActivityRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [{ albumId: DummyValue.UUID }] })
  search(options: ActivitySearch) {
    const { userId, assetId, albumId, isLiked } = options;

    return this.db
      .selectFrom('activity')
      .selectAll('activity')
      .innerJoin('users', (join) => join.onRef('users.id', '=', 'activity.userId').on('users.deletedAt', 'is', null))
      .innerJoinLateral(
        (eb) =>
          eb
            .selectFrom(sql`(select 1)`.as('dummy'))
            .select(columns.userWithPrefix)
            .as('user'),
        (join) => join.onTrue(),
      )
      .select((eb) => eb.fn.toJson('user').as('user'))
      .leftJoin('assets', (join) => join.onRef('assets.id', '=', 'activity.assetId').on('assets.deletedAt', 'is', null))
      .$if(!!userId, (qb) => qb.where('activity.userId', '=', userId!))
      .$if(assetId === null, (qb) => qb.where('assetId', 'is', null))
      .$if(!!assetId, (qb) => qb.where('activity.assetId', '=', assetId!))
      .$if(!!albumId, (qb) => qb.where('activity.albumId', '=', albumId!))
      .$if(isLiked !== undefined, (qb) => qb.where('activity.isLiked', '=', isLiked!))
      .orderBy('activity.createdAt', 'asc')
      .execute();
  }

  @GenerateSql({ params: [{ albumId: DummyValue.UUID, userId: DummyValue.UUID }] })
  async create(activity: Insertable<Activity>) {
    return this.db
      .insertInto('activity')
      .values(activity)
      .returningAll()
      .returning((eb) =>
        jsonObjectFrom(eb.selectFrom('users').whereRef('users.id', '=', 'activity.userId').select(columns.user)).as(
          'user',
        ),
      )
      .$narrowType<{ user: NotNull }>()
      .executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async delete(id: string) {
    await this.db.deleteFrom('activity').where('id', '=', asUuid(id)).execute();
  }

  @GenerateSql({ params: [{ albumId: DummyValue.UUID, assetId: DummyValue.UUID }] })
  async getStatistics({ albumId, assetId }: { albumId: string; assetId?: string }): Promise<number> {
    const { count } = await this.db
      .selectFrom('activity')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .innerJoin('users', (join) => join.onRef('users.id', '=', 'activity.userId').on('users.deletedAt', 'is', null))
      .leftJoin('assets', 'assets.id', 'activity.assetId')
      .$if(!!assetId, (qb) => qb.where('activity.assetId', '=', assetId!))
      .where('activity.albumId', '=', albumId)
      .where('activity.isLiked', '=', false)
      .where('assets.deletedAt', 'is', null)
      .executeTakeFirstOrThrow();

    return count;
  }
}
