import { Injectable } from '@nestjs/common';
import { Kysely, NotNull, sql } from 'kysely';
import { jsonArrayFrom } from 'kysely/helpers/postgres';
import { InjectKysely } from 'nestjs-kysely';
import { columns } from 'src/database';
import { Chunked, DummyValue, GenerateSql } from 'src/decorators';
import { MapAsset } from 'src/dtos/asset-response.dto';
import { AssetType, VectorIndex } from 'src/enum';
import { probes } from 'src/repositories/database.repository';
import { DB } from 'src/schema';
import { anyUuid, asUuid, withDefaultVisibility } from 'src/utils/database';

// Maximum number of candidate duplicates to return from vector search
const DUPLICATE_SEARCH_LIMIT = 64;

interface DuplicateSearch {
  assetId: string;
  embedding: string;
  maxDistance: number;
  type: AssetType;
  userIds: string[];
}

interface DuplicateMergeOptions {
  targetId: string | null;
  assetIds: string[];
  sourceIds: string[];
}

@Injectable()
export class DuplicateRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID] })
  getAll(userId: string) {
    return (
      this.db
        .with('duplicates', (qb) =>
          qb
            .selectFrom('asset')
            .$call(withDefaultVisibility)
            // Use innerJoinLateral to build a composite object per asset that includes
            // exifInfo and tags. This "asset2" object is then aggregated via jsonAgg.
            // Tags must be included here (not via separate joins) so they appear in the
            // final MapAsset[] output - needed for tag synchronization during resolution.
            .innerJoinLateral(
              (qb) =>
                qb
                  .selectFrom('asset_exif')
                  .selectAll('asset')
                  .select((eb) => eb.fn.toJson('asset_exif').as('exifInfo'))
                  .select((eb) =>
                    jsonArrayFrom(
                      eb
                        .selectFrom('tag')
                        .select(columns.tag)
                        .innerJoin('tag_asset', 'tag.id', 'tag_asset.tagId')
                        .whereRef('tag_asset.assetId', '=', 'asset.id'),
                    ).as('tags'),
                  )
                  .whereRef('asset_exif.assetId', '=', 'asset.id')
                  .as('asset2'),
              (join) => join.onTrue(),
            )
            .select('asset.duplicateId')
            .select((eb) =>
              eb.fn.jsonAgg('asset2').orderBy('asset.localDateTime', 'asc').$castTo<MapAsset[]>().as('assets'),
            )
            .where('asset.ownerId', '=', asUuid(userId))
            .where('asset.duplicateId', 'is not', null)
            .$narrowType<{ duplicateId: NotNull }>()
            .where('asset.deletedAt', 'is', null)
            .where('asset.stackId', 'is', null)
            .groupBy('asset.duplicateId'),
        )
        .selectFrom('duplicates')
        .selectAll()
        // Filter out singleton groups (only 1 asset) directly in the query
        .where((eb) => eb(eb.fn('json_array_length', ['assets']), '>', 1))
        .execute()
    );
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async cleanupSingletonGroups(userId: string): Promise<void> {
    // Remove duplicateId from assets that are the only member of their duplicate group
    await this.db
      .with('singletons', (qb) =>
        qb
          .selectFrom('asset')
          .select('duplicateId')
          .where('ownerId', '=', asUuid(userId))
          .where('duplicateId', 'is not', null)
          .$narrowType<{ duplicateId: NotNull }>()
          .where('deletedAt', 'is', null)
          .where('stackId', 'is', null)
          .groupBy('duplicateId')
          .having((eb) => eb.fn.count('id'), '=', 1),
      )
      .updateTable('asset')
      .set({ duplicateId: null })
      .from('singletons')
      .whereRef('asset.duplicateId', '=', 'singletons.duplicateId')
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  async get(duplicateId: string): Promise<{ duplicateId: string; assets: MapAsset[] } | undefined> {
    const result = await this.db
      .selectFrom('asset')
      .$call(withDefaultVisibility)
      // Use innerJoinLateral to build a composite object per asset that includes
      // exifInfo and tags. This "asset2" object is then aggregated via jsonAgg.
      // Tags must be included here (not via separate joins) so they appear in the
      // final MapAsset[] output - needed for tag synchronization during resolution.
      .innerJoinLateral(
        (qb) =>
          qb
            .selectFrom('asset_exif')
            .selectAll('asset')
            .select((eb) => eb.fn.toJson('asset_exif').as('exifInfo'))
            .select((eb) =>
              jsonArrayFrom(
                eb
                  .selectFrom('tag')
                  .select(columns.tag)
                  .innerJoin('tag_asset', 'tag.id', 'tag_asset.tagId')
                  .whereRef('tag_asset.assetId', '=', 'asset.id'),
              ).as('tags'),
            )
            .whereRef('asset_exif.assetId', '=', 'asset.id')
            .as('asset2'),
        (join) => join.onTrue(),
      )
      .select('asset.duplicateId')
      .select((eb) => eb.fn.jsonAgg('asset2').orderBy('asset.localDateTime', 'asc').$castTo<MapAsset[]>().as('assets'))
      .where('asset.duplicateId', '=', asUuid(duplicateId))
      .where('asset.deletedAt', 'is', null)
      .where('asset.stackId', 'is', null)
      .groupBy('asset.duplicateId')
      .executeTakeFirst();

    if (!result || !result.duplicateId) {
      return undefined;
    }

    return { duplicateId: result.duplicateId, assets: result.assets };
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  async delete(userId: string, id: string): Promise<void> {
    await this.db
      .updateTable('asset')
      .set({ duplicateId: null })
      .where('ownerId', '=', userId)
      .where('duplicateId', '=', id)
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, [DummyValue.UUID]] })
  @Chunked({ paramIndex: 1 })
  async deleteAll(userId: string, ids: string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    await this.db
      .updateTable('asset')
      .set({ duplicateId: null })
      .where('ownerId', '=', userId)
      .where('duplicateId', 'in', ids)
      .execute();
  }

  @GenerateSql({
    params: [
      {
        assetId: DummyValue.UUID,
        embedding: DummyValue.VECTOR,
        maxDistance: 0.6,
        type: AssetType.Image,
        userIds: [DummyValue.UUID],
      },
    ],
  })
  search({ assetId, embedding, maxDistance, type, userIds }: DuplicateSearch) {
    return this.db.transaction().execute(async (trx) => {
      await sql`set local vchordrq.probes = ${sql.lit(probes[VectorIndex.Clip])}`.execute(trx);
      return await trx
        .with('cte', (qb) =>
          qb
            .selectFrom('asset')
            .$call(withDefaultVisibility)
            .select([
              'asset.id as assetId',
              'asset.duplicateId',
              sql<number>`smart_search.embedding <=> ${embedding}`.as('distance'),
            ])
            .innerJoin('smart_search', 'asset.id', 'smart_search.assetId')
            .where('asset.ownerId', '=', anyUuid(userIds))
            .where('asset.deletedAt', 'is', null)
            .where('asset.type', '=', type)
            .where('asset.id', '!=', asUuid(assetId))
            .where('asset.stackId', 'is', null)
            .orderBy('distance')
            .limit(DUPLICATE_SEARCH_LIMIT),
        )
        .selectFrom('cte')
        .selectAll()
        .where('cte.distance', '<=', maxDistance as number)
        .execute();
    });
  }

  @GenerateSql({
    params: [{ targetDuplicateId: DummyValue.UUID, duplicateIds: [DummyValue.UUID], assetIds: [DummyValue.UUID] }],
  })
  async merge(options: DuplicateMergeOptions): Promise<void> {
    await this.db
      .updateTable('asset')
      .set({ duplicateId: options.targetId })
      .where((eb) =>
        eb.or([eb('duplicateId', '=', anyUuid(options.sourceIds)), eb('id', '=', anyUuid(options.assetIds))]),
      )
      .execute();
  }
}
