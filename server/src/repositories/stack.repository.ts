import { Injectable } from '@nestjs/common';
import { ExpressionBuilder, Insertable, Kysely, Updateable } from 'kysely';
import { jsonArrayFrom } from 'kysely/helpers/postgres';
import { InjectKysely } from 'nestjs-kysely';
import { dirname, parse } from 'node:path';
import { columns } from 'src/database';
import { DummyValue, GenerateSql } from 'src/decorators';
import { AssetStatus, AssetType } from 'src/enum';
import { DB } from 'src/schema';
import { StackTable } from 'src/schema/tables/stack.table';
import { asUuid, withDefaultVisibility } from 'src/utils/database';
import { mimeTypes } from 'src/utils/mime-types';

export interface StackSearch {
  ownerId: string;
  primaryAssetId?: string;
}

const jpegExtensions = new Set(['.jpe', '.jpeg', '.jpg']);
const isJpeg = (filename: string) => jpegExtensions.has(parse(filename).ext.toLowerCase());
const getBasename = (filename: string) => parse(filename).name.toLowerCase();

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

  private getRawPairAsset(db: Kysely<DB>, id: string) {
    return db
      .selectFrom('asset')
      .innerJoin('asset_exif', 'asset_exif.assetId', 'asset.id')
      .select([
        'asset.id',
        'asset.ownerId',
        'asset.type',
        'asset.originalPath',
        'asset.originalFileName',
        'asset.fileCreatedAt',
        'asset.libraryId',
        'asset.visibility',
        'asset.stackId',
        'asset.isEdited',
      ])
      .where('asset.id', '=', id)
      .where('asset.deletedAt', 'is', null)
      .where('asset.status', '=', AssetStatus.Active)
      .executeTakeFirst();
  }

  /**
   * Creates a stack for an unambiguous RAW+JPEG pair. Existing stacks are left
   * alone so automatic pairing never changes a user's manual organization.
   */
  async autoStackRawPair(assetId: string): Promise<string | undefined> {
    const initial = await this.getRawPairAsset(this.db, assetId);
    if (
      !initial ||
      initial.type !== AssetType.Image ||
      initial.isEdited ||
      initial.stackId ||
      (!mimeTypes.isRaw(initial.originalFileName) && !isJpeg(initial.originalFileName))
    ) {
      return;
    }

    return this.db.transaction().execute(async (tx) => {
      const assets = await tx
        .selectFrom('asset')
        .innerJoin('asset_exif', 'asset_exif.assetId', 'asset.id')
        .select(['asset.id', 'asset.originalPath', 'asset.originalFileName', 'asset_exif.make', 'asset_exif.model'])
        .where('asset.ownerId', '=', initial.ownerId)
        .where('asset.type', '=', AssetType.Image)
        .where('asset.fileCreatedAt', '=', initial.fileCreatedAt)
        .where('asset.visibility', '=', initial.visibility)
        .where('asset.stackId', 'is', null)
        .where('asset.isEdited', '=', false)
        .where('asset.deletedAt', 'is', null)
        .where('asset.status', '=', AssetStatus.Active)
        .$if(initial.libraryId === null, (qb) => qb.where('asset.libraryId', 'is', null))
        .$if(initial.libraryId !== null, (qb) => qb.where('asset.libraryId', '=', initial.libraryId!))
        .orderBy('asset.id')
        .forUpdate('asset')
        .execute();

      const current = assets.find(({ id }) => id === assetId);
      if (!current) {
        return;
      }

      const currentIsRaw = mimeTypes.isRaw(current.originalFileName);
      const matches = assets.filter((candidate) => {
        const isComplement = currentIsRaw
          ? isJpeg(candidate.originalFileName)
          : mimeTypes.isRaw(candidate.originalFileName);
        const isSameDirectory =
          initial.libraryId === null ||
          dirname(current.originalPath).toLowerCase() === dirname(candidate.originalPath).toLowerCase();

        return (
          candidate.id !== current.id &&
          isComplement &&
          isSameDirectory &&
          getBasename(candidate.originalFileName) === getBasename(current.originalFileName) &&
          candidate.make === current.make &&
          candidate.model === current.model
        );
      });

      if (matches.length !== 1) {
        return;
      }

      const match = matches[0];
      const primaryAssetId = currentIsRaw ? match.id : current.id;
      const { id } = await tx
        .insertInto('stack')
        .values({ ownerId: initial.ownerId, primaryAssetId })
        .returning('id')
        .executeTakeFirstOrThrow();

      await tx
        .updateTable('asset')
        .set({ stackId: id, updatedAt: new Date() })
        .where('id', 'in', [current.id, match.id])
        .execute();

      return id;
    });
  }

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
