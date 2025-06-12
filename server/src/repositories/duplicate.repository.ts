import { Injectable } from '@nestjs/common';
import { Kysely, NotNull, sql } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DB } from 'src/db';
import { DummyValue, GenerateSql } from 'src/decorators';
import { MapAsset } from 'src/dtos/asset-response.dto';
import { AssetType, VectorIndex } from 'src/enum';
import { probes } from 'src/repositories/database.repository';
import { anyUuid, asUuid, withDefaultVisibility } from 'src/utils/database';

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
            .selectFrom('assets')
            .$call(withDefaultVisibility)
            .leftJoinLateral(
              (qb) =>
                qb
                  .selectFrom('exif')
                  .selectAll('assets')
                  .select((eb) => eb.table('exif').as('exifInfo'))
                  .whereRef('exif.assetId', '=', 'assets.id')
                  .as('asset'),
              (join) => join.onTrue(),
            )
            .select('assets.duplicateId')
            .select((eb) =>
              eb.fn.jsonAgg('asset').orderBy('assets.localDateTime', 'asc').$castTo<MapAsset[]>().as('assets'),
            )
            .where('assets.ownerId', '=', asUuid(userId))
            .where('assets.duplicateId', 'is not', null)
            .$narrowType<{ duplicateId: NotNull }>()
            .where('assets.deletedAt', 'is', null)
            .where('assets.stackId', 'is', null)
            .groupBy('assets.duplicateId'),
        )
        .with('unique', (qb) =>
          qb
            .selectFrom('duplicates')
            .select('duplicateId')
            .where((eb) => eb(eb.fn('json_array_length', ['assets']), '=', 1)),
        )
        .with('removed_unique', (qb) =>
          qb
            .updateTable('assets')
            .set({ duplicateId: null })
            .from('unique')
            .whereRef('assets.duplicateId', '=', 'unique.duplicateId'),
        )
        .selectFrom('duplicates')
        .selectAll()
        // TODO: compare with filtering by json_array_length > 1
        .where(({ not, exists }) =>
          not(exists((eb) => eb.selectFrom('unique').whereRef('unique.duplicateId', '=', 'duplicates.duplicateId'))),
        )
        .execute()
    );
  }

  @GenerateSql({
    params: [
      {
        assetId: DummyValue.UUID,
        embedding: DummyValue.VECTOR,
        maxDistance: 0.6,
        type: AssetType.IMAGE,
        userIds: [DummyValue.UUID],
      },
    ],
  })
  search({ assetId, embedding, maxDistance, type, userIds }: DuplicateSearch) {
    return this.db.transaction().execute(async (trx) => {
      await sql`set local vchordrq.probes = ${sql.lit(probes[VectorIndex.CLIP])}`.execute(trx);
      return await trx
        .with('cte', (qb) =>
          qb
            .selectFrom('assets')
            .$call(withDefaultVisibility)
            .select([
              'assets.id as assetId',
              'assets.duplicateId',
              sql<number>`smart_search.embedding <=> ${embedding}`.as('distance'),
            ])
            .innerJoin('smart_search', 'assets.id', 'smart_search.assetId')
            .where('assets.ownerId', '=', anyUuid(userIds))
            .where('assets.deletedAt', 'is', null)
            .where('assets.type', '=', type)
            .where('assets.id', '!=', asUuid(assetId))
            .where('assets.stackId', 'is', null)
            .orderBy('distance')
            .limit(64),
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
      .updateTable('assets')
      .set({ duplicateId: options.targetId })
      .where((eb) =>
        eb.or([eb('duplicateId', '=', anyUuid(options.sourceIds)), eb('id', '=', anyUuid(options.assetIds))]),
      )
      .execute();
  }
}
