import { Injectable } from '@nestjs/common';
import { ExpressionBuilder, Insertable, Kysely, Updateable } from 'kysely';
import { jsonArrayFrom } from 'kysely/helpers/postgres';
import { InjectKysely } from 'nestjs-kysely';
import { columns } from 'src/database';
import { DummyValue, GenerateSql } from 'src/decorators';
import { DB } from 'src/schema';
import { StackTable } from 'src/schema/tables/stack.table';
import { asUuid, isStackPrimaryConstraint, withDefaultVisibility } from 'src/utils/database';

export interface StackSearch {
  ownerId: string;
  primaryAssetId?: string;
}

const withAssets = (eb: ExpressionBuilder<DB, 'stack'>, withTags = false) => {
  return jsonArrayFrom(
    eb
      .selectFrom('asset')
      .selectAll('asset')
      .innerJoinLateral(
        (eb) =>
          eb
            .selectFrom('asset_exif')
            .select(columns.exif)
            .whereRef('asset_exif.assetId', '=', 'asset.id')
            .as('exifInfo'),
        (join) => join.onTrue(),
      )
      .$if(withTags, (eb) =>
        eb.select((eb) =>
          jsonArrayFrom(
            eb
              .selectFrom('tag')
              .select(columns.tag)
              .innerJoin('tag_asset', 'tag.id', 'tag_asset.tagId')
              .whereRef('tag_asset.assetId', '=', 'asset.id'),
          ).as('tags'),
        ),
      )
      .select((eb) => eb.fn.toJson('exifInfo').as('exifInfo'))
      .where('asset.deletedAt', 'is', null)
      .whereRef('asset.stackId', '=', 'stack.id')
      .$call(withDefaultVisibility),
  ).as('assets');
};

@Injectable()
export class StackRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [{ ownerId: DummyValue.UUID }] })
  search(query: StackSearch) {
    return this.db
      .selectFrom('stack')
      .selectAll('stack')
      .select(withAssets)
      .where('stack.ownerId', '=', query.ownerId)
      .$if(!!query.primaryAssetId, (eb) => eb.where('stack.primaryAssetId', '=', query.primaryAssetId!))
      .execute();
  }

  async create(entity: Omit<Insertable<StackTable>, 'primaryAssetId'>, assetIds: string[]) {
    return this.db.transaction().execute(async (tx) => {
      const stacks = await tx
        .selectFrom('stack')
        .where('stack.ownerId', '=', entity.ownerId)
        .where('stack.primaryAssetId', 'in', assetIds)
        .select('stack.id')
        .select((eb) =>
          jsonArrayFrom(
            eb
              .selectFrom('asset')
              .select('asset.id')
              .whereRef('asset.stackId', '=', 'stack.id')
              .where('asset.deletedAt', 'is', null),
          ).as('assets'),
        )
        .execute();

      const uniqueIds = new Set<string>(assetIds);

      // children
      for (const stack of stacks) {
        if (stack.assets && stack.assets.length > 0) {
          for (const asset of stack.assets) {
            uniqueIds.add(asset.id);
          }
        }
      }

      if (stacks.length > 0) {
        await tx
          .deleteFrom('stack')
          .where(
            'id',
            'in',
            stacks.map((stack) => stack.id),
          )
          .execute();
      }

      const newRecord = await tx
        .insertInto('stack')
        .values({ ...entity, primaryAssetId: assetIds[0] })
        .returning('id')
        .executeTakeFirstOrThrow();

      await tx
        .updateTable('asset')
        .set({
          stackId: newRecord.id,
          updatedAt: new Date(),
        })
        .where('id', 'in', [...uniqueIds])
        .execute();

      return tx
        .selectFrom('stack')
        .selectAll('stack')
        .select(withAssets)
        .where('id', '=', newRecord.id)
        .executeTakeFirstOrThrow();
    });
  }

  /**
   * Link `newAssetId` into the stack containing `parentId`. By default the new
   * asset becomes the stack primary (edit-pair semantics: the latest edit leads).
   * With `keepPrimary`, the parent/existing primary is preserved and the new
   * asset just joins — used for iOS burst frames so the representative stays the
   * displayed cover.
   */
  async linkAsset(
    ownerId: string,
    newAssetId: string,
    parentId: string,
    keepPrimary = false,
  ): Promise<{ stackId: string; created: boolean } | null> {
    try {
      return await this.db.transaction().execute(async (tx) => {
        // Lock the parent so two concurrent uploads can't each create a stack for it.
        const parent = await tx
          .selectFrom('asset')
          .select(['id', 'ownerId', 'stackId', 'deletedAt'])
          .where('id', '=', asUuid(parentId))
          .forUpdate()
          .executeTakeFirst();

        if (!parent || parent.ownerId !== ownerId || parent.deletedAt) {
          return null;
        }

        // A re-uploaded duplicate can resolve to a trashed row; a trashed asset
        // must never become (or, with keepPrimary, silently join) the stack.
        const newAsset = await tx
          .selectFrom('asset')
          .select(['id', 'deletedAt'])
          .where('id', '=', asUuid(newAssetId))
          .forUpdate()
          .executeTakeFirst();

        if (!newAsset || newAsset.deletedAt) {
          return null;
        }

        if (parent.stackId) {
          await tx
            .updateTable('asset')
            .set({ stackId: parent.stackId, updatedAt: new Date() })
            .where('id', '=', asUuid(newAssetId))
            .execute();
          // keepPrimary: leave the existing primary, just touch the stack;
          // otherwise promote the newcomer.
          await tx
            .updateTable('stack')
            .set(keepPrimary ? { updatedAt: new Date() } : { primaryAssetId: newAssetId, updatedAt: new Date() })
            .where('id', '=', parent.stackId)
            .execute();
          return { stackId: parent.stackId, created: false };
        }

        const stack = await tx
          .insertInto('stack')
          .values({ ownerId, primaryAssetId: keepPrimary ? parent.id : newAssetId })
          .returning('id')
          .executeTakeFirstOrThrow();

        await tx
          .updateTable('asset')
          .set({ stackId: stack.id, updatedAt: new Date() })
          .where('id', 'in', [asUuid(newAssetId), parent.id])
          .execute();

        return { stackId: stack.id, created: true };
      });
    } catch (error) {
      // newAssetId may already be another stack's primary (e.g. a retried upload).
      // Treat the unique-constraint hit as "couldn't stack" rather than a 500.
      if (isStackPrimaryConstraint(error)) {
        return null;
      }
      throw error;
    }
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async delete(id: string): Promise<void> {
    await this.db.deleteFrom('stack').where('id', '=', asUuid(id)).execute();
  }

  async deleteAll(ids: string[]): Promise<void> {
    await this.db.deleteFrom('stack').where('id', 'in', ids).execute();
  }

  update(id: string, entity: Updateable<StackTable>) {
    return this.db
      .updateTable('stack')
      .set(entity)
      .where('id', '=', asUuid(id))
      .returningAll('stack')
      .returning((eb) => withAssets(eb, true))
      .executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getById(id: string) {
    return this.db
      .selectFrom('stack')
      .selectAll()
      .select((eb) => withAssets(eb, true))
      .where('id', '=', asUuid(id))
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  getForAssetRemoval(assetId: string) {
    return this.db
      .selectFrom('asset')
      .leftJoin('stack', 'stack.id', 'asset.stackId')
      .select(['stackId as id', 'stack.primaryAssetId'])
      .where('asset.id', '=', assetId)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [{ sourceId: DummyValue.UUID, targetId: DummyValue.UUID }] })
  merge({ sourceId, targetId }: { sourceId: string; targetId: string }) {
    return this.db.updateTable('asset').set({ stackId: targetId }).where('asset.stackId', '=', sourceId).execute();
  }
}
