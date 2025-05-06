import { Injectable } from '@nestjs/common';
import { ExpressionBuilder, Kysely, Updateable } from 'kysely';
import { jsonArrayFrom } from 'kysely/helpers/postgres';
import { InjectKysely } from 'nestjs-kysely';
import { columns } from 'src/database';
import { AssetStack, DB } from 'src/db';
import { DummyValue, GenerateSql } from 'src/decorators';
import { asUuid } from 'src/utils/database';

export interface StackSearch {
  ownerId: string;
  primaryAssetId?: string;
}

const withAssets = (eb: ExpressionBuilder<DB, 'asset_stack'>, withTags = false) => {
  return jsonArrayFrom(
    eb
      .selectFrom('assets')
      .selectAll('assets')
      .innerJoinLateral(
        (eb) => eb.selectFrom('exif').select(columns.exif).whereRef('exif.assetId', '=', 'assets.id').as('exifInfo'),
        (join) => join.onTrue(),
      )
      .$if(withTags, (eb) =>
        eb.select((eb) =>
          jsonArrayFrom(
            eb
              .selectFrom('tags')
              .select(columns.tag)
              .innerJoin('tag_asset', 'tags.id', 'tag_asset.tagsId')
              .whereRef('tag_asset.assetsId', '=', 'assets.id'),
          ).as('tags'),
        ),
      )
      .select((eb) => eb.fn.toJson('exifInfo').as('exifInfo'))
      .where('assets.deletedAt', 'is', null)
      .whereRef('assets.stackId', '=', 'asset_stack.id'),
  ).as('assets');
};

@Injectable()
export class StackRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [{ ownerId: DummyValue.UUID }] })
  search(query: StackSearch) {
    return this.db
      .selectFrom('asset_stack')
      .selectAll('asset_stack')
      .select(withAssets)
      .where('asset_stack.ownerId', '=', query.ownerId)
      .$if(!!query.primaryAssetId, (eb) => eb.where('asset_stack.primaryAssetId', '=', query.primaryAssetId!))
      .execute();
  }

  async create(entity: { ownerId: string; assetIds: string[] }) {
    return this.db.transaction().execute(async (tx) => {
      const stacks = await tx
        .selectFrom('asset_stack')
        .where('asset_stack.ownerId', '=', entity.ownerId)
        .where('asset_stack.primaryAssetId', 'in', entity.assetIds)
        .select('asset_stack.id')
        .select((eb) =>
          jsonArrayFrom(
            eb
              .selectFrom('assets')
              .select('assets.id')
              .whereRef('assets.stackId', '=', 'asset_stack.id')
              .where('assets.deletedAt', 'is', null),
          ).as('assets'),
        )
        .execute();

      const assetIds = new Set<string>(entity.assetIds);

      // children
      for (const stack of stacks) {
        if (stack.assets && stack.assets.length > 0) {
          for (const asset of stack.assets) {
            assetIds.add(asset.id);
          }
        }
      }

      if (stacks.length > 0) {
        await tx
          .deleteFrom('asset_stack')
          .where(
            'id',
            'in',
            stacks.map((stack) => stack.id),
          )
          .execute();
      }

      const newRecord = await tx
        .insertInto('asset_stack')
        .values({
          ownerId: entity.ownerId,
          primaryAssetId: entity.assetIds[0],
        })
        .returning('id')
        .executeTakeFirstOrThrow();

      await tx
        .updateTable('assets')
        .set({
          stackId: newRecord.id,
          updatedAt: new Date(),
        })
        .where('id', 'in', [...assetIds])
        .execute();

      return tx
        .selectFrom('asset_stack')
        .selectAll('asset_stack')
        .select(withAssets)
        .where('id', '=', newRecord.id)
        .executeTakeFirstOrThrow();
    });
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async delete(id: string): Promise<void> {
    await this.db.deleteFrom('asset_stack').where('id', '=', asUuid(id)).execute();
  }

  async deleteAll(ids: string[]): Promise<void> {
    await this.db.deleteFrom('asset_stack').where('id', 'in', ids).execute();
  }

  update(id: string, entity: Updateable<AssetStack>) {
    return this.db
      .updateTable('asset_stack')
      .set(entity)
      .where('id', '=', asUuid(id))
      .returningAll('asset_stack')
      .returning((eb) => withAssets(eb, true))
      .executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getById(id: string) {
    return this.db
      .selectFrom('asset_stack')
      .selectAll()
      .select((eb) => withAssets(eb, true))
      .where('id', '=', asUuid(id))
      .executeTakeFirst();
  }
}
