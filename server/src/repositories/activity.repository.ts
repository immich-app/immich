import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, NotNull, sql } from 'kysely';
import { jsonObjectFrom } from 'kysely/helpers/postgres';
import { InjectKysely } from 'nestjs-kysely';
import { columns } from 'src/database';
import { DummyValue, GenerateSql } from 'src/decorators';
import { AssetVisibility } from 'src/enum';
import { DB } from 'src/schema';
import { ActivityTable } from 'src/schema/tables/activity.table';
import { asUuid, dummy } from 'src/utils/database';

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
      .innerJoin('user as user2', (join) =>
        join.onRef('user2.id', '=', 'activity.userId').on('user2.deletedAt', 'is', null),
      )
      .innerJoinLateral(
        (eb) => eb.selectFrom(dummy).select(columns.userWithPrefix).as('user'),
        (join) => join.onTrue(),
      )
      .select((eb) => eb.fn.toJson('user').as('user'))
      .leftJoin('asset', 'asset.id', 'activity.assetId')
      .$if(!!userId, (qb) => qb.where('activity.userId', '=', userId!))
      .$if(assetId === null, (qb) => qb.where('assetId', 'is', null))
      .$if(!!assetId, (qb) => qb.where('activity.assetId', '=', assetId!))
      .$if(!!albumId, (qb) => qb.where('activity.albumId', '=', albumId!))
      .$if(isLiked !== undefined, (qb) => qb.where('activity.isLiked', '=', isLiked!))
      .where('asset.deletedAt', 'is', null)
      .orderBy('activity.createdAt', 'asc')
      .execute();
  }

  @GenerateSql({ params: [{ albumId: DummyValue.UUID }] })
  searchAssetAdditions({ albumId, assetId, userId }: { albumId: string; assetId?: string; userId?: string }) {
    return this.db
      .selectFrom('album_asset')
      .select(['album_asset.albumId', 'album_asset.assetId', 'album_asset.createdAt'])
      .innerJoin('asset', (join) =>
        join
          .onRef('asset.id', '=', 'album_asset.assetId')
          .on('asset.deletedAt', 'is', null)
          .on('asset.visibility', '!=', sql.lit(AssetVisibility.Locked)),
      )
      .leftJoin('user as adder', (join) =>
        join.onRef('adder.id', '=', 'album_asset.createdById').on('adder.deletedAt', 'is', null),
      )
      .innerJoin('user as user2', (join) =>
        join
          // attribute to the adding user, falling back to the asset owner when unknown or deleted
          .on((eb) => eb('user2.id', '=', eb.fn.coalesce('adder.id', 'asset.ownerId')))
          .on('user2.deletedAt', 'is', null),
      )
      .innerJoinLateral(
        (eb) => eb.selectFrom(dummy).select(columns.userWithPrefix).as('user'),
        (join) => join.onTrue(),
      )
      .select((eb) => [eb.ref('asset.type').as('assetType'), eb.fn.toJson('user').as('user')])
      .where('album_asset.albumId', '=', albumId)
      .$if(!!assetId, (qb) => qb.where('album_asset.assetId', '=', assetId!))
      .$if(!!userId, (qb) => qb.where('user2.id', '=', userId!))
      .orderBy('album_asset.createdAt', 'asc')
      .orderBy('user2.id', 'asc')
      .orderBy('asset.fileCreatedAt', 'asc')
      .execute();
  }

  @GenerateSql({ params: [{ albumId: DummyValue.UUID, userId: DummyValue.UUID }] })
  async create(activity: Insertable<ActivityTable>) {
    return this.db
      .insertInto('activity')
      .values(activity)
      .returningAll()
      .returning((eb) =>
        jsonObjectFrom(eb.selectFrom('user').whereRef('user.id', '=', 'activity.userId').select(columns.user)).as(
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
  async getStatistics({
    albumId,
    assetId,
  }: {
    albumId: string;
    assetId?: string;
  }): Promise<{ comments: number; likes: number }> {
    const result = await this.db
      .selectFrom('activity')
      .select((eb) => [
        eb.fn.countAll<number>().filterWhere('activity.isLiked', '=', false).as('comments'),
        eb.fn.countAll<number>().filterWhere('activity.isLiked', '=', true).as('likes'),
      ])
      .innerJoin('user', (join) => join.onRef('user.id', '=', 'activity.userId').on('user.deletedAt', 'is', null))
      .leftJoin('asset', 'asset.id', 'activity.assetId')
      .$if(!!assetId, (qb) => qb.where('activity.assetId', '=', assetId!))
      .where('activity.albumId', '=', albumId)
      .where(({ or, and, eb }) =>
        or([
          and([eb('asset.deletedAt', 'is', null), eb('asset.visibility', '!=', sql.lit(AssetVisibility.Locked))]),
          eb('asset.id', 'is', null),
        ]),
      )
      .executeTakeFirstOrThrow();

    return result;
  }
}
