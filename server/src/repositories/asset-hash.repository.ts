import { Injectable, Logger } from '@nestjs/common';
import { Insertable, Kysely, sql } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DummyValue, GenerateSql } from 'src/decorators';
import { DB } from 'src/schema';
import { AssetHashTable } from 'src/schema/tables/asset-hash.table';
import { asUuid } from 'src/utils/database';

export interface AssetHashCandidates {
  assetId: string;
  matchRatio: number;
}

@Injectable()
export class AssetHashRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID] })
  async getByAssetId(assetId: string) {
    return this.db
      .selectFrom('asset_hash')
      .selectAll()
      .where('assetId', '=', asUuid(assetId))
      .executeTakeFirst();
  }

  async upsert(hash: Insertable<AssetHashTable>) {
    await this.db
      .insertInto('asset_hash')
      .values({
        ...hash,
        // Cast binary string directly to BIT(64) - standard 64-bit pHash
        phash: hash.phash ? sql`${hash.phash}::bit(64)` : null,
      })
      .onConflict((oc) =>
        oc.column('assetId').doUpdateSet({
          phash: hash.phash ? sql`${hash.phash}::bit(64)` : null,
        }),
      )
      .execute();
  }

  /**
   * Find assets with similar perceptual hashes using Hamming distance.
   * Returns candidates where match ratio >= minMatch (converted from maxDistance).
   * Uses standard 64-bit DCT-based perceptual hash.
   */
  @GenerateSql({ params: [DummyValue.UUID, '0'.repeat(64), 10, [DummyValue.UUID]] })
  async findSimilarByPhash(
    excludeAssetId: string,
    targetPhash: string,
    maxHammingDistance: number,
    candidateAssetIds: string[],
  ): Promise<AssetHashCandidates[]> {
    if (candidateAssetIds.length === 0) {
      return [];
    }

    const results = await this.db
      .selectFrom('asset_hash')
      .select(['assetId'])
      .select((eb) =>
        sql<number>`(64 - bit_count(phash # ${targetPhash}::bit(64))) / 64.0`.as('matchRatio'),
      )
      .where('assetId', 'in', candidateAssetIds)
      .where('assetId', '!=', asUuid(excludeAssetId))
      .where('phash', 'is not', null)
      .where((eb) =>
        eb(sql<number>`bit_count(phash # ${targetPhash}::bit(64))`, '<=', maxHammingDistance),
      )
      .execute();

    return results;
  }


  @GenerateSql({ params: [[DummyValue.UUID]] })
  async deleteByAssetIds(assetIds: string[]): Promise<void> {
    if (assetIds.length === 0) {
      return;
    }
    await this.db.deleteFrom('asset_hash').where('assetId', 'in', assetIds).execute();
  }
}
