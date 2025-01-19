import { Injectable } from '@nestjs/common';
import { ExpressionBuilder, Kysely, Updateable } from 'kysely';
import { jsonArrayFrom } from 'kysely/helpers/postgres';
import { InjectKysely } from 'nestjs-kysely';
import { DB } from 'src/db';
import { DummyValue, GenerateSql } from 'src/decorators';
import { StackEntity } from 'src/entities/stack.entity';
import { IStackRepository, StackSearch } from 'src/interfaces/stack.interface';
import { asUuid } from 'src/utils/database';

/**
 * Including EXIF and Tags
 * */
const withAssets = (eb: ExpressionBuilder<DB, 'asset_stack'>) => {
  return eb
    .selectFrom((eb) =>
      eb
        .selectFrom('assets')
        .selectAll('assets')
        .innerJoin('exif', 'assets.id', 'exif.assetId')
        .select((eb) => eb.fn.toJson('exif').as('exifInfo'))
        .select((eb) =>
          jsonArrayFrom(
            eb
              .selectFrom('tags')
              .selectAll('tags')
              .innerJoin('tag_asset', 'tags.id', 'tag_asset.tagsId')
              .whereRef('tag_asset.assetsId', '=', 'assets.id'),
          ).as('tags'),
        )
        .whereRef('assets.stackId', '=', 'asset_stack.id')
        .as('asset'),
    )
    .select((eb) => eb.fn.jsonAgg('asset').as('assets'))
    .orderBy('asset.fileCreatedAt')
    .as('asset_lat');
};

@Injectable()
export class StackRepository implements IStackRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [{ ownerId: DummyValue.UUID }] })
  search(query: StackSearch): Promise<StackEntity[]> {
    return this.db
      .selectFrom('asset_stack')
      .selectAll('asset_stack')
      .leftJoinLateral(withAssets, (join) => join.onTrue())
      .select('assets')
      .where('asset_stack.ownerId', '=', query.ownerId)
      .$if(!!query.primaryAssetId, (eb) => eb.where('asset_stack.primaryAssetId', '=', query.primaryAssetId!))
      .execute() as Promise<StackEntity[]>;
  }

  async create(entity: { ownerId: string; assetIds: string[] }): Promise<StackEntity> {
    return this.db.transaction().execute(async (tx) => {
      const stacks = await tx
        .selectFrom('asset_stack')
        .leftJoinLateral(withAssets, (join) => join.onTrue())
        .where('asset_stack.ownerId', '=', entity.ownerId)
        .where('asset_stack.primaryAssetId', 'in', entity.assetIds)
        .selectAll('asset_stack')
        .select('assets')
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
        .executeTakeFirst();

      if (!newRecord) {
        throw new Error('Failed to create stack');
      }

      await tx
        .updateTable('assets')
        .set({
          stackId: newRecord.id,
          updatedAt: new Date(),
        })
        .where('id', 'in', [...assetIds])
        .execute();

      return (await tx
        .selectFrom('asset_stack')
        .where('id', '=', newRecord.id)
        .selectAll('asset_stack')
        .leftJoinLateral(withAssets, (join) => join.onTrue())
        .select('assets')
        .executeTakeFirst()) as StackEntity;
    });
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async delete(id: string): Promise<void> {
    const stack = await this.getById(id);
    if (!stack) {
      return;
    }

    const assetIds = stack.assets.map(({ id }) => id);

    await this.db.deleteFrom('asset_stack').where('id', '=', asUuid(id)).execute();
    await this.db
      .updateTable('assets')
      .set({ stackId: null, updatedAt: new Date() })
      .where('id', 'in', assetIds)
      .execute();
  }

  async deleteAll(ids: string[]): Promise<void> {
    const assetIds = [];
    for (const id of ids) {
      const stack = await this.getById(id);
      if (!stack) {
        continue;
      }

      assetIds.push(...stack.assets.map(({ id }) => id));
    }

    await this.db.deleteFrom('assets').where('stackId', 'in', ids).execute();
    await this.db.updateTable('assets').set({ updatedAt: new Date() }).where('id', 'in', assetIds).execute();
  }

  async update(id: string, entity: Updateable<StackEntity>): Promise<StackEntity> {
    await this.db.updateTable('asset_stack').set(entity).where('id', '=', asUuid(id)).executeTakeFirst();

    const stack = await this.getById(id);

    if (!stack) {
      throw new Error('Failed to update stack');
    }

    return stack;
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async getById(id: string): Promise<StackEntity | undefined> {
    return this.db
      .selectFrom('asset_stack')
      .where('asset_stack.id', '=', asUuid(id))
      .selectAll('asset_stack')
      .leftJoinLateral(withAssets, (join) => join.onTrue())
      .select('assets')
      .executeTakeFirst() as Promise<StackEntity | undefined>;
  }
}
