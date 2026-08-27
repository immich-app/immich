import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, NotNull, sql } from 'kysely';
import { jsonObjectFrom } from 'kysely/helpers/postgres';
import { InjectKysely } from 'nestjs-kysely';
import { columns } from 'src/database';
import { DummyValue, GenerateSql } from 'src/decorators';
import { AssetVisibility } from 'src/enum';
import { DB } from 'src/schema';
import { ActivityTable } from 'src/schema/tables/activity.table';
import { anyUuid, asUuid, dummy } from 'src/utils/database';

export interface ActivitySearch {
  albumId?: string;
  assetId?: string | null;
  userId?: string;
  isLiked?: boolean;
}

export interface ActivityAssetMerge {
  sourceAssetIds: string[];
  targetAssetId: string;
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

  /**
   * Re-points comments and likes from `sourceAssetIds` onto `targetAssetId` so they survive the
   * source assets being trashed or deleted (duplicate resolution merges the losers into a keeper).
   *
   * Activities are keyed on `(albumId, assetId)` and the table has a composite foreign key onto
   * `album_asset`, so a row can only move into an album the target is already a member of. Rows in
   * any other album are left alone rather than being made unreachable by every activity query.
   *
   * Every comment moves, textual duplicates included - two separate comments really did exist.
   * Likes are unique per `(albumId, userId, assetId)`, so at most one like per `(albumId, userId)`
   * moves, and only when that user has not already liked the target.
   *
   * @returns the number of activities that were moved
   */
  async mergeAssetActivities({ sourceAssetIds, targetAssetId }: ActivityAssetMerge): Promise<number> {
    if (sourceAssetIds.length === 0) {
      return 0;
    }

    return this.db.transaction().execute(async (tx) => {
      const comments = await tx
        .updateTable('activity')
        .set({ assetId: targetAssetId })
        .where('activity.assetId', '=', anyUuid(sourceAssetIds))
        .where('activity.isLiked', '=', false)
        .where((eb) =>
          eb.exists(
            eb
              .selectFrom('album_asset')
              .whereRef('album_asset.albumId', '=', 'activity.albumId')
              .where('album_asset.assetId', '=', asUuid(targetAssetId)),
          ),
        )
        .executeTakeFirst();

      const likes = await tx
        .with('mergeable_like', (qb) =>
          qb
            .selectFrom('activity')
            .select('activity.id')
            // the unique like index only allows one like per (albumId, userId) on the target
            .distinctOn(['activity.albumId', 'activity.userId'])
            .innerJoin('album_asset', (join) =>
              join
                .onRef('album_asset.albumId', '=', 'activity.albumId')
                .on('album_asset.assetId', '=', asUuid(targetAssetId)),
            )
            .where('activity.assetId', '=', anyUuid(sourceAssetIds))
            .where('activity.isLiked', '=', true)
            .where((eb) =>
              eb.not(
                eb.exists(
                  eb
                    .selectFrom('activity as existing')
                    .whereRef('existing.albumId', '=', 'activity.albumId')
                    .whereRef('existing.userId', '=', 'activity.userId')
                    .where('existing.assetId', '=', asUuid(targetAssetId))
                    .where('existing.isLiked', '=', true),
                ),
              ),
            )
            // oldest like wins, so the merge is deterministic
            .orderBy('activity.albumId')
            .orderBy('activity.userId')
            .orderBy('activity.createdAt')
            .orderBy('activity.id'),
        )
        .updateTable('activity')
        .set({ assetId: targetAssetId })
        .where('activity.id', 'in', (eb) => eb.selectFrom('mergeable_like').select('mergeable_like.id'))
        .executeTakeFirst();

      return Number(comments.numUpdatedRows) + Number(likes.numUpdatedRows);
    });
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
