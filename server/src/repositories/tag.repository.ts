import { Injectable } from '@nestjs/common';
import type { InsertQueryBuilder, Insertable, Kysely, QueryCreator, Selectable, Updateable } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { columns } from 'src/database.js';
import { ChunkedArray, DummyValue, GenerateSql } from 'src/decorators.js';
import { AccessRepository } from 'src/repositories/access.repository.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { DB } from 'src/schema/index.js';
import { TagAssetTable } from 'src/schema/tables/tag-asset.table.js';
import { TagTable } from 'src/schema/tables/tag.table.js';
import { anyUuid, hasPrivateTagAncestor, resetAssetPrivacySync } from 'src/utils/database.js';

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

  @GenerateSql({ params: [DummyValue.UUID] })
  async getAssetIdsByTagId(tagId: string, db = this.db): Promise<string[]> {
    const rows = await db
      .selectFrom('tag_closure')
      .innerJoin('tag_asset', 'tag_asset.tagId', 'tag_closure.id_descendant')
      .select('tag_asset.assetId')
      .distinct()
      .where('tag_closure.id_ancestor', '=', tagId)
      .execute();

    return rows.map(({ assetId }) => assetId);
  }

  @GenerateSql({ params: [{ userId: DummyValue.UUID, value: DummyValue.STRING, parentId: DummyValue.UUID }] })
  async upsertValue({ userId, value, parentId: _parentId }: { userId: string; value: string; parentId?: string }) {
    const parentId = _parentId ?? null;
    return this.insertTagWithClosures((db) =>
      db
        .insertInto('tag')
        .values({ userId, value, parentId })
        .onConflict((oc) => oc.columns(['userId', 'value']).doUpdateSet({ parentId }))
        .returningAll(),
    ).executeTakeFirstOrThrow();
  }

  async hasPrivatePath(userId: string, values: string[]) {
    if (values.length === 0) {
      return false;
    }
    const match = await this.db
      .selectFrom('tag')
      .select('tag.id')
      .where('tag.userId', '=', userId)
      .where('tag.value', 'in', values)
      .where((eb) => hasPrivateTagAncestor(eb.ref('tag.id')))
      .executeTakeFirst();
    return !!match;
  }

  async getPrivateDescendants(id: string, db = this.db) {
    return db
      .selectFrom('tag_closure')
      .innerJoin('tag', 'tag.id', 'tag_closure.id_descendant')
      .select('tag.id')
      .select((eb) => eb.exists(eb.selectFrom('tag_asset').whereRef('tag_asset.tagId', '=', 'tag.id')).as('hasAssets'))
      .where('tag_closure.id_ancestor', '=', id)
      .where((eb) => hasPrivateTagAncestor(eb.ref('tag.id')))
      .execute();
  }

  private async filterPrivateIds(db: Kysely<DB>, ids: string[]) {
    const tags = await db
      .selectFrom('tag')
      .select('id')
      .where('tag.id', '=', anyUuid(ids))
      .where((eb) => hasPrivateTagAncestor(eb.ref('tag.id')))
      .execute();
    return new Set(tags.map(({ id }) => id));
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getAll(userId: string, { includePrivate = false }: { includePrivate?: boolean } = {}) {
    return this.db
      .selectFrom('tag')
      .select(columns.tag)
      .where('userId', '=', userId)
      .$if(!includePrivate, (qb) => qb.where((eb) => eb.not(hasPrivateTagAncestor(eb.ref('tag.id')))))
      .orderBy('value')
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.STRING] })
  getBySystemKey(userId: string, systemKey: string) {
    return this.db
      .selectFrom('tag')
      .select(columns.tag)
      .where('userId', '=', userId)
      .where('systemKey', '=', systemKey)
      .executeTakeFirst();
  }

  async getOrCreateSystemTag({
    userId,
    value,
    systemKey,
    isPrivate,
  }: {
    userId: string;
    value: string;
    systemKey: string;
    isPrivate: boolean;
  }) {
    for (let attempt = 0; ; attempt++) {
      const existing = await this.getBySystemKey(userId, systemKey);
      if (existing) {
        return existing;
      }
      const candidate = attempt === 0 ? value : `${value}-system-${userId}-${attempt}`;
      const tag = await this.insertTagWithClosures((db) =>
        db
          .insertInto('tag')
          .values({ userId, value: candidate, systemKey, isPrivate })
          .onConflict((oc) => oc.doNothing())
          .returningAll(),
      ).executeTakeFirst();
      if (tag) {
        return tag;
      }
    }
  }

  @GenerateSql({ params: [{ userId: DummyValue.UUID, color: DummyValue.STRING, value: DummyValue.STRING }] })
  create(tag: Insertable<TagTable>) {
    return this.insertTagWithClosures((db) =>
      db.insertInto('tag').values(tag).returningAll(),
    ).executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID, { value: DummyValue.STRING, color: DummyValue.STRING }] })
  async update(id: string, dto: Pick<Updateable<TagTable>, 'value' | 'color' | 'isPrivate'>) {
    return this.db.transaction().execute(async (tx) => {
      if (dto.isPrivate !== undefined) {
        await this.lockSubtree(tx, id);
      }
      const previousTag = await tx
        .selectFrom('tag')
        .select(['value', 'isPrivate'])
        .where('id', '=', id)
        .executeTakeFirst();
      const privacyChanged = previousTag && dto.isPrivate !== undefined && dto.isPrivate !== previousTag.isPrivate;
      const renamed = previousTag && dto.value !== undefined && dto.value !== previousTag.value;

      if (privacyChanged && dto.isPrivate === false && (await this.getAssetCount(id, tx)) > 0) {
        return { error: 'hasAssets' } as const;
      }

      const tag = await tx.updateTable('tag').set(dto).where('id', '=', id).returningAll().executeTakeFirstOrThrow();

      // Check if value has changed, trigger value updates on all children if so
      if (renamed) {
        await tx
          // Use a recursive cte to get all levels of nested child tags that need to be updated
          .withRecursive('descendants(id, value)', (qb) => {
            const directChildren = qb
              .selectFrom('tag as child')
              .select((eb) => [
                'child.id as id',
                eb
                  .fn<string>('concat', [
                    eb.cast<string>(eb.val(tag.value), 'text'),
                    eb.cast<string>(eb.val('/'), 'text'),
                    eb.fn<string>('regexp_replace', ['child.value', eb.val('^.*/'), eb.val('')]),
                  ])
                  .as('value'),
              ])
              .where('child.parentId', '=', id);

            const nestedChildren = qb
              .selectFrom('tag as child')
              .innerJoin('descendants as parent', 'parent.id', 'child.parentId')
              .select((eb) => [
                'child.id as id',
                eb
                  .fn<string>('concat', [
                    'parent.value',
                    eb.cast<string>(eb.val('/'), 'text'),
                    eb.fn<string>('regexp_replace', ['child.value', eb.val('^.*/'), eb.val('')]),
                  ])
                  .as('value'),
              ]);

            return directChildren.unionAll(nestedChildren);
          })
          .updateTable('tag')
          .from('descendants')
          .set((eb) => ({
            value: eb.ref('descendants.value'),
          }))
          .whereRef('tag.id', '=', 'descendants.id')
          .execute();
      }
      const assetIds = renamed || privacyChanged ? await this.getAssetIdsByTagId(id, tx) : [];
      const privacyUserIds = privacyChanged ? await resetAssetPrivacySync(tx, tag.userId, assetIds) : [];
      return { tag, assetIds, privacyUserIds };
    });
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async delete(id: string, includePrivate = false) {
    return this.db.transaction().execute(async (tx) => {
      await this.lockSubtree(tx, id);
      const privateTags = await this.getPrivateDescendants(id, tx);
      if (privateTags.length > 0 && !includePrivate) {
        return { error: 'private' } as const;
      }
      if (privateTags.some(({ hasAssets }) => hasAssets)) {
        return { error: 'hasAssets' } as const;
      }
      const assetIds = await this.getAssetIdsByTagId(id, tx);
      await tx.deleteFrom('tag').where('id', '=', id).execute();
      return { assetIds };
    });
  }

  async changeAssetLinks<T>(
    ownerId: string,
    tagIds: string[],
    write: (
      bulk: Pick<TagRepository, 'removeAssetIds' | 'upsertAssetIds'>,
      access: AccessRepository,
      tx: Kysely<DB>,
    ) => Promise<{ result: T; links: { tagId: string; assetId: string }[] }>,
  ) {
    return this.db.transaction().execute(async (tx) => {
      await this.lockTagAncestors(tx, tagIds);

      const { result, links } = await write(
        {
          removeAssetIds: (tagId, ids) => this.removeAssetIds(tagId, ids, tx),
          upsertAssetIds: (items) => this.upsertAssetIds(items, tx),
        },
        new AccessRepository(tx),
        tx,
      );
      if (links.length === 0) {
        return { result, privacyUserIds: [] };
      }

      const privateTags = await this.filterPrivateIds(tx, [...new Set(links.map(({ tagId }) => tagId))]);
      const assetIds = [...new Set(links.filter(({ tagId }) => privateTags.has(tagId)).map(({ assetId }) => assetId))];
      const privacyUserIds = await resetAssetPrivacySync(tx, ownerId, assetIds);
      return { result, privacyUserIds };
    });
  }

  private lockTagAncestors(tx: Kysely<DB>, tagIds: string[]) {
    return tx
      .selectFrom('tag')
      .select('id')
      .where('id', 'in', (eb) =>
        eb.selectFrom('tag_closure').select('id_ancestor').where('id_descendant', '=', anyUuid(tagIds)),
      )
      .orderBy('id')
      .forShare()
      .execute();
  }

  private lockSubtree(tx: Kysely<DB>, id: string) {
    return tx
      .selectFrom('tag')
      .select('id')
      .where('id', 'in', (eb) => eb.selectFrom('tag_closure').select('id_descendant').where('id_ancestor', '=', id))
      .orderBy('id')
      .forUpdate()
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async getAssetCount(id: string, db = this.db): Promise<number> {
    const row = await db
      .selectFrom('tag_asset')
      .innerJoin('tag_closure', 'tag_asset.tagId', 'tag_closure.id_descendant')
      .select((eb) => eb.fn.count<string>('tag_asset.assetId').distinct().as('count'))
      .where('tag_closure.id_ancestor', '=', id)
      .executeTakeFirstOrThrow();
    return Number(row.count);
  }

  @GenerateSql({ params: [DummyValue.UUID, [DummyValue.UUID]] })
  async getAssetIds(tagId: string, assetIds: string[]): Promise<Set<string>> {
    const rows = await this.db
      .selectFrom('tag_asset')
      .select('assetId')
      .where('tagId', '=', tagId)
      .where('assetId', '=', anyUuid(assetIds))
      .execute();
    return new Set(rows.map(({ assetId }) => assetId));
  }

  @GenerateSql({ params: [DummyValue.UUID, [DummyValue.UUID]] })
  removeAssetIds(tagId: string, assetIds: string[], db = this.db) {
    return db === this.db
      ? db.transaction().execute((tx) => this.removeTagFromAssets(tx, tagId, assetIds))
      : this.removeTagFromAssets(db, tagId, assetIds);
  }

  private async removeTagFromAssets(db: Kysely<DB>, tagId: string, assetIds: string[]) {
    const links = await db
      .deleteFrom('tag_asset')
      .where('tagId', '=', tagId)
      .where('assetId', '=', anyUuid(assetIds))
      .returning(['assetId', 'tagId'])
      .execute();
    if (links.length === 0) {
      return links;
    }

    const privateTags = await this.filterPrivateIds(db, [tagId]);
    if (!privateTags.has(tagId)) {
      return links;
    }

    const stillIds = links.map(({ assetId }) => assetId);
    const motionAssets = await db
      .selectFrom('asset as motion')
      .select('motion.id')
      .where('motion.id', 'in', (eb) =>
        eb.selectFrom('asset as still').select('still.livePhotoVideoId').where('still.id', '=', anyUuid(stillIds)),
      )
      .orderBy('motion.id')
      .forUpdate()
      .execute();

    const motionIds = motionAssets.map(({ id }) => id);
    if (motionIds.length > 0) {
      await db
        .deleteFrom('tag_asset')
        .where('tagId', '=', tagId)
        .where('assetId', '=', anyUuid(motionIds))
        .where('isLivePhotoCompanion', '=', true)
        .where((eb) =>
          eb.not(
            eb.exists(
              eb
                .selectFrom('asset as remaining_still')
                .innerJoin('tag_asset as still_tag', 'still_tag.assetId', 'remaining_still.id')
                .whereRef('remaining_still.livePhotoVideoId', '=', 'tag_asset.assetId')
                .where('still_tag.tagId', '=', tagId),
            ),
          ),
        )
        .execute();
    }

    return links;
  }

  @GenerateSql({ params: [[{ assetId: DummyValue.UUID, tagId: DummyValue.UUID }]] })
  @ChunkedArray()
  upsertAssetIds(items: Insertable<TagAssetTable>[], db = this.db) {
    if (items.length === 0) {
      return Promise.resolve([]);
    }

    return db
      .insertInto('tag_asset')
      .values(items)
      .onConflict((oc) => oc.doNothing())
      .returning(['assetId', 'tagId'])
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, [DummyValue.UUID]] })
  replaceAssetTags(assetId: string, tagIds: string[], includePrivate = false) {
    return this.db.transaction().execute(async (tx) => {
      const existing = await tx.selectFrom('tag_asset').select('tagId').where('assetId', '=', assetId).execute();
      const existingIds = existing.map(({ tagId }) => tagId);
      await this.lockTagAncestors(tx, [...new Set([...tagIds, ...existingIds])]);

      await tx
        .deleteFrom('tag_asset')
        .where('assetId', '=', assetId)
        .where('tagId', '=', anyUuid(existingIds))
        .where((eb) => eb.not(hasPrivateTagAncestor(eb.ref('tag_asset.tagId'))))
        .execute();

      const privateTagIds = await this.filterPrivateIds(tx, tagIds);
      const tagsToAdd = includePrivate ? tagIds : tagIds.filter((tagId) => !privateTagIds.has(tagId));
      const added = await this.upsertAssetIds(
        tagsToAdd.map((tagId) => ({ tagId, assetId })),
        tx,
      );

      if (added.some(({ tagId }) => privateTagIds.has(tagId))) {
        const asset = await tx
          .selectFrom('asset')
          .select('ownerId')
          .where('id', '=', assetId)
          .executeTakeFirstOrThrow();
        return resetAssetPrivacySync(tx, asset.ownerId, [assetId]);
      }
      return [];
    });
  }

  async deleteEmptyTags() {
    const result = await this.db
      .deleteFrom('tag')
      .where(({ not, exists, selectFrom }) =>
        not(
          exists(
            selectFrom('tag_closure')
              .innerJoin('tag as descendant', 'descendant.id', 'tag_closure.id_descendant')
              .whereRef('tag_closure.id_ancestor', '=', 'tag.id')
              .where('descendant.isPrivate', '=', true),
          ),
        ),
      )
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

  insertTagWithClosures(insertTag: (db: QueryCreator<DB>) => InsertQueryBuilder<DB, 'tag', Selectable<TagTable>>) {
    return this.db
      .with('created_tag', insertTag)
      .with('created_tag_closures', (db) =>
        db
          .insertInto('tag_closure')
          .columns(['id_ancestor', 'id_descendant'])
          .expression((eb) =>
            eb
              .selectFrom('created_tag')
              .select(['created_tag.id as id_ancestor', 'created_tag.id as id_descendant'])
              .unionAll(
                eb
                  .selectFrom('created_tag')
                  .innerJoin('tag_closure', 'tag_closure.id_descendant', 'created_tag.parentId')
                  .select(['tag_closure.id_ancestor', 'created_tag.id as id_descendant']),
              ),
          )
          .onConflict((oc) => oc.doNothing()),
      )
      .selectFrom('created_tag')
      .selectAll();
  }
}
