import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, sql, Updateable } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { columns } from 'src/database';
import { DB, TagAsset, Tags } from 'src/db';
import { Chunked, ChunkedSet, DummyValue, GenerateSql } from 'src/decorators';
import { LoggingRepository } from 'src/repositories/logging.repository';

@Injectable()
export class TagRepository {
  constructor(
    @InjectKysely() private db: Kysely<DB>,
    private logger: LoggingRepository,
  ) {
    this.logger.setContext(TagRepository.name);
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  get(id: string) {
    return this.db.selectFrom('tags').select(columns.tag).where('id', '=', id).executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.STRING] })
  getByValue(userId: string, value: string) {
    return this.db
      .selectFrom('tags')
      .select(columns.tag)
      .where('userId', '=', userId)
      .where('value', '=', value)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [{ userId: DummyValue.UUID, value: DummyValue.STRING, parentId: DummyValue.UUID }] })
  async upsertValue({ userId, value, parentId: _parentId }: { userId: string; value: string; parentId?: string }) {
    const parentId = _parentId ?? null;
    return this.db.transaction().execute(async (tx) => {
      const tag = await this.db
        .insertInto('tags')
        .values({ userId, value, parentId })
        .onConflict((oc) => oc.columns(['userId', 'value']).doUpdateSet({ parentId }))
        .returning(columns.tag)
        .executeTakeFirstOrThrow();

      // update closure table
      await tx
        .insertInto('tags_closure')
        .values({ id_ancestor: tag.id, id_descendant: tag.id })
        .onConflict((oc) => oc.doNothing())
        .execute();

      if (parentId) {
        await tx
          .insertInto('tags_closure')
          .columns(['id_ancestor', 'id_descendant'])
          .expression(
            this.db
              .selectFrom('tags_closure')
              .select(['id_ancestor', sql.raw<string>(`'${tag.id}'`).as('id_descendant')])
              .where('id_descendant', '=', parentId),
          )
          .onConflict((oc) => oc.doNothing())
          .execute();
      }

      return tag;
    });
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getAll(userId: string) {
    return this.db.selectFrom('tags').select(columns.tag).where('userId', '=', userId).orderBy('value asc').execute();
  }

  @GenerateSql({ params: [{ userId: DummyValue.UUID, color: DummyValue.STRING, value: DummyValue.STRING }] })
  create(tag: Insertable<Tags>) {
    return this.db.insertInto('tags').values(tag).returningAll().executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID, { color: DummyValue.STRING }] })
  update(id: string, dto: Updateable<Tags>) {
    return this.db.updateTable('tags').set(dto).where('id', '=', id).returningAll().executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async delete(id: string) {
    await this.db.deleteFrom('tags').where('id', '=', id).execute();
  }

  @ChunkedSet({ paramIndex: 1 })
  @GenerateSql({ params: [DummyValue.UUID, [DummyValue.UUID]] })
  async getAssetIds(tagId: string, assetIds: string[]): Promise<Set<string>> {
    if (assetIds.length === 0) {
      return new Set();
    }

    const results = await this.db
      .selectFrom('tag_asset')
      .select(['assetsId as assetId'])
      .where('tagsId', '=', tagId)
      .where('assetsId', 'in', assetIds)
      .execute();

    return new Set(results.map(({ assetId }) => assetId));
  }

  @GenerateSql({ params: [DummyValue.UUID, [DummyValue.UUID]] })
  @Chunked({ paramIndex: 1 })
  async addAssetIds(tagId: string, assetIds: string[]): Promise<void> {
    if (assetIds.length === 0) {
      return;
    }

    await this.db
      .insertInto('tag_asset')
      .values(assetIds.map((assetId) => ({ tagsId: tagId, assetsId: assetId })))
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, [DummyValue.UUID]] })
  @Chunked({ paramIndex: 1 })
  async removeAssetIds(tagId: string, assetIds: string[]): Promise<void> {
    if (assetIds.length === 0) {
      return;
    }

    await this.db.deleteFrom('tag_asset').where('tagsId', '=', tagId).where('assetsId', 'in', assetIds).execute();
  }

  @GenerateSql({ params: [{ assetId: DummyValue.UUID, tagsIds: [DummyValue.UUID] }] })
  @Chunked()
  upsertAssetIds(items: Insertable<TagAsset>[]) {
    if (items.length === 0) {
      return Promise.resolve([]);
    }

    return this.db
      .insertInto('tag_asset')
      .values(items)
      .onConflict((oc) => oc.doNothing())
      .returningAll()
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, [DummyValue.UUID]] })
  @Chunked({ paramIndex: 1 })
  replaceAssetTags(assetId: string, tagIds: string[]) {
    return this.db.transaction().execute(async (tx) => {
      await tx.deleteFrom('tag_asset').where('assetsId', '=', assetId).execute();

      if (tagIds.length === 0) {
        return;
      }

      return tx
        .insertInto('tag_asset')
        .values(tagIds.map((tagId) => ({ tagsId: tagId, assetsId: assetId })))
        .onConflict((oc) => oc.doNothing())
        .returningAll()
        .execute();
    });
  }

  @GenerateSql()
  async deleteEmptyTags() {
    // TODO rewrite as a single statement
    await this.db.transaction().execute(async (tx) => {
      const result = await tx
        .selectFrom('assets')
        .innerJoin('tag_asset', 'tag_asset.assetsId', 'assets.id')
        .innerJoin('tags_closure', 'tags_closure.id_descendant', 'tag_asset.tagsId')
        .innerJoin('tags', 'tags.id', 'tags_closure.id_descendant')
        .select((eb) => ['tags.id', eb.fn.count<number>('assets.id').as('count')])
        .groupBy('tags.id')
        .execute();

      const ids = result.filter(({ count }) => count === 0).map(({ id }) => id);
      if (ids.length > 0) {
        await this.db.deleteFrom('tags').where('id', 'in', ids).execute();
        this.logger.log(`Deleted ${ids.length} empty tags`);
      }
    });
  }
}
