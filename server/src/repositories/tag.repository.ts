import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, sql, Updateable } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { columns } from 'src/database';
import { Chunked, ChunkedSet, DummyValue, GenerateSql } from 'src/decorators';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { DB } from 'src/schema';
import { TagAssetTable } from 'src/schema/tables/tag-asset.table';
import { TagTable } from 'src/schema/tables/tag.table';

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
    return this.db.selectFrom('tag').select(columns.tag).where('id', '=', id).executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.STRING] })
  getByValue(userId: string, value: string) {
    return this.db
      .selectFrom('tag')
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
        .insertInto('tag')
        .values({ userId, value, parentId })
        .onConflict((oc) => oc.columns(['userId', 'value']).doUpdateSet({ parentId }))
        .returning(columns.tag)
        .executeTakeFirstOrThrow();

      // update closure table
      await tx
        .insertInto('tag_closure')
        .values({ id_ancestor: tag.id, id_descendant: tag.id })
        .onConflict((oc) => oc.doNothing())
        .execute();

      if (parentId) {
        await tx
          .insertInto('tag_closure')
          .columns(['id_ancestor', 'id_descendant'])
          .expression(
            this.db
              .selectFrom('tag_closure')
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
    return this.db.selectFrom('tag').select(columns.tag).where('userId', '=', userId).orderBy('value').execute();
  }

  @GenerateSql({ params: [{ userId: DummyValue.UUID, color: DummyValue.STRING, value: DummyValue.STRING }] })
  create(tag: Insertable<TagTable>) {
    return this.db.insertInto('tag').values(tag).returningAll().executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID, { color: DummyValue.STRING }] })
  update(id: string, dto: Updateable<TagTable>) {
    return this.db.updateTable('tag').set(dto).where('id', '=', id).returningAll().executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async delete(id: string) {
    await this.db.deleteFrom('tag').where('id', '=', id).execute();
  }

  @ChunkedSet({ paramIndex: 1 })
  @GenerateSql({ params: [DummyValue.UUID, [DummyValue.UUID]] })
  async getAssetIds(tagId: string, assetIds: string[]): Promise<Set<string>> {
    if (assetIds.length === 0) {
      return new Set();
    }

    const results = await this.db
      .selectFrom('tag_asset')
      .select(['assetId as assetId'])
      .where('tagId', '=', tagId)
      .where('assetId', 'in', assetIds)
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
      .values(assetIds.map((assetId) => ({ tagId, assetId })))
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, [DummyValue.UUID]] })
  @Chunked({ paramIndex: 1 })
  async removeAssetIds(tagId: string, assetIds: string[]): Promise<void> {
    if (assetIds.length === 0) {
      return;
    }

    await this.db.deleteFrom('tag_asset').where('tagId', '=', tagId).where('assetId', 'in', assetIds).execute();
  }

  @GenerateSql({ params: [[{ assetId: DummyValue.UUID, tagIds: DummyValue.UUID }]] })
  @Chunked()
  upsertAssetIds(items: Insertable<TagAssetTable>[]) {
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
      await tx.deleteFrom('tag_asset').where('assetId', '=', assetId).execute();

      if (tagIds.length === 0) {
        return;
      }

      return tx
        .insertInto('tag_asset')
        .values(tagIds.map((tagId) => ({ tagId, assetId })))
        .onConflict((oc) => oc.doNothing())
        .returningAll()
        .execute();
    });
  }

  async deleteEmptyTags() {
    const result = await this.db
      .deleteFrom('tag')
      .where(({ not, exists, selectFrom }) =>
        not(
          exists(
            selectFrom('tag_closure')
              .whereRef('tag.id', '=', 'tag_closure.id_ancestor')
              .innerJoin('tag_asset', 'tag_closure.id_descendant', 'tag_asset.tagId'),
          ),
        ),
      )
      .executeTakeFirst();

    const deletedRows = Number(result.numDeletedRows);
    if (deletedRows > 0) {
      this.logger.log(`Deleted ${deletedRows} empty tags`);
    }
  }
}
