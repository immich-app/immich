import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, Selectable, sql, Transaction, Updateable } from 'kysely';
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

  // #region tags
  @GenerateSql({ params: [DummyValue.UUID] })
  getOne(id: string) {
    return this.db.selectFrom('tags').select(columns.tag).where('id', '=', id).executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async getMany(ids: string[]) {
    return await this.db.selectFrom('tags').select(columns.tag).where('id', 'in', ids).execute();
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

      await this.updateTagClosures(tag, tx);

      return tag;
    });
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getAll(userId: string) {
    return this.db.selectFrom('tags').select(columns.tag).where('userId', '=', userId).orderBy('value asc').execute();
  }

  @GenerateSql({ params: [{ userId: DummyValue.UUID, color: DummyValue.STRING, value: DummyValue.STRING }] })
  async create(tag: Insertable<Tags>) {
    let createdTag: Selectable<Tags>;
    await this.db.transaction().execute(async (tx) => {
      createdTag = await tx.insertInto('tags').values(tag).returningAll().executeTakeFirstOrThrow();
      await this.updateTagClosures(createdTag, tx);
    });
    return createdTag!;
  }

  @GenerateSql({ params: [DummyValue.UUID, { value: DummyValue.STRING, color: DummyValue.STRING }] })
  async update(id: string, dto: Updateable<Tags>) {
    let updated: Selectable<Tags>;
    await this.db.transaction().execute(async (tx) => {
      updated = await tx.updateTable('tags').set(dto).where('id', '=', id).returningAll().executeTakeFirstOrThrow();

      if (dto.value) {
        // propagate value update downstream
        const descendantIds = await this.getDescendantIds(id);
        const descendants = await this.getMany(descendantIds.filter((_id) => _id !== id));
        const childrenByParentId = new Map<string, { id: string; value: string }[]>();
        for (const descendant of descendants) {
          const parentId = descendant.parentId;
          if (parentId) {
            if (!childrenByParentId.has(parentId)) {
              childrenByParentId.set(parentId, []);
            }
            childrenByParentId.get(parentId)!.push(descendant);
          }
        }

        const queue: { id: string; value: string }[] = [{ id, value: updated.value }];
        for (let i = 0; i < queue.length; i++) {
          const { id, value } = queue[i];
          const children = childrenByParentId.get(id) ?? [];
          for (const child of children) {
            const name = child.value.split('/').at(-1)!;
            const item = { id: child.id, value: `${value}/${name}` };
            queue.push(item);
          }
        }

        const toUpdate = queue.slice(1);
        if (toUpdate.length > 0) {
          await sql`
          UPDATE tags
          SET value = updates.value
          FROM (
            VALUES
              ${sql.join(
                toUpdate.map((u) => sql`(${sql`${u.id}::uuid`}, ${u.value})`),
                sql`, `,
              )}
          ) AS updates(id, value)
          WHERE tags.id = updates.id
        `.execute(tx);
        }
      }
    });

    return updated!;
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async delete(id: string) {
    await this.db.deleteFrom('tags').where('id', '=', id).execute();
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
  // #endregion

  // #region tag_asset
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
  // #endregion

  // #region tag_closure
  async getDescendantIds(ancestorId: string) {
    const results = await this.db
      .selectFrom('tags_closure')
      .select('id_descendant')
      .where('id_ancestor', '=', ancestorId)
      .execute();

    return results.map((r) => r.id_descendant);
  }

  async updateTagClosures(tag: { id: string; parentId?: string | null }, tx: Transaction<DB>) {
    // update closure table
    await tx
      .insertInto('tags_closure')
      .values({ id_ancestor: tag.id, id_descendant: tag.id })
      .onConflict((oc) => oc.doNothing())
      .execute();

    if (tag.parentId) {
      await tx
        .insertInto('tags_closure')
        .columns(['id_ancestor', 'id_descendant'])
        .expression(
          this.db
            .selectFrom('tags_closure')
            .select(['id_ancestor', sql.raw<string>(`'${tag.id}'`).as('id_descendant')])
            .where('id_descendant', '=', tag.parentId),
        )
        .onConflict((oc) => oc.doNothing())
        .execute();
    }
  }
  // #endregion
}
