import { Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { asUuid } from 'src/utils/database';

@Injectable()
export class AutoStackCandidateRepository {
  constructor(@InjectKysely() private db: Kysely<any>) {}

  deleteAll(id: string) {
    return this.db.deleteFrom('auto_stack_candidate').where('ownerId', '=', asUuid(id)).execute();
  }

  async create(
    ownerId: string,
    assetIds: string[],
    score: number,
    scoreComponents?: Record<string, number>,
    avgCos?: number,
  ) {
    if (assetIds.length < 2) return null;
    const [{ id }] = await this.db
      .insertInto('auto_stack_candidate')
      .values({ ownerId: asUuid(ownerId), score, scoreComponents: JSON.stringify(scoreComponents || {}), avgCos })
      .returning('id')
      .execute();

    await this.db
      .insertInto('auto_stack_candidate_asset')
      .values(assetIds.map((assetId, idx) => ({ candidateId: id, assetId: asUuid(assetId), position: idx })))
      .execute();

    return id;
  }

  async existsForAssets(assetIds: string[]): Promise<boolean> {
    if (assetIds.length === 0) return false;
    const row = await this.db
      .selectFrom('auto_stack_candidate_asset')
      .select('candidateId')
      .where('assetId', 'in', assetIds)
      .limit(1)
      .executeTakeFirst();
    return !!row;
  }

  async list(ownerId: string, options?: { limit?: number }) {
    // Fetch candidate ids first.
    const candidates = await this.db
      .selectFrom('auto_stack_candidate')
      .select(['id', 'score', 'scoreComponents', 'avgCos'])
      .where('ownerId', '=', asUuid(ownerId))
      .where('dismissedAt', 'is', null)
      .where('promotedStackId', 'is', null)
      .orderBy('score', 'desc')
      .orderBy('createdAt', 'desc')
      .$if(!!options?.limit, (qb: any) => qb.limit(options!.limit!))
      .execute();

    if (!candidates.length)
      return [] as Array<{ id: string; count: number; assets: { assetId: string; position: number }[] }>;

    const candidateIds = candidates.map((c: any) => c.id);
    const assets = await this.db
      .selectFrom('auto_stack_candidate_asset')
      .select(['candidateId', 'assetId', 'position'])
      .where('candidateId', 'in', candidateIds)
      .orderBy('candidateId')
      .orderBy('position')
      .execute();

    const grouped: Record<string, { assetId: string; position: number }[]> = {};
    for (const row of assets as any[]) {
      (grouped[row.candidateId] = grouped[row.candidateId] || []).push({
        assetId: row.assetId,
        position: row.position,
      });
    }

    return candidates.map((c: any) => {
      const list = grouped[c.id] || [];
      return {
        id: c.id as string,
        count: list.length,
        assets: list,
        score: c.score,
        scoreComponents: c.scoreComponents,
        avgCos: c.avgCos,
      };
    });
  }

  async prune(ownerId: string, max: number): Promise<number> {
    // Delete oldest (lowest score then oldest) beyond max
    const rows = await this.db
      .selectFrom('auto_stack_candidate')
      .select(['id'])
      .where('ownerId', '=', asUuid(ownerId))
      .where('dismissedAt', 'is', null)
      .where('promotedStackId', 'is', null)
      .orderBy('score', 'desc')
      .orderBy('createdAt', 'desc')
      .offset(max)
      .execute();
    if (!rows.length) return 0;
    const ids = rows.map((r: any) => r.id);
    await this.db.deleteFrom('auto_stack_candidate').where('id', 'in', ids).execute();
    return ids.length;
  }

  async dismiss(id: string, ownerId: string) {
    await this.db
      .updateTable('auto_stack_candidate')
      .set({ dismissedAt: new Date() })
      .where('id', '=', id)
      .where('ownerId', '=', asUuid(ownerId))
      .executeTakeFirst();
  }

  async promote(id: string, ownerId: string, stackId: string) {
    await this.db
      .updateTable('auto_stack_candidate')
      .set({ promotedStackId: asUuid(stackId) })
      .where('id', '=', id)
      .where('ownerId', '=', asUuid(ownerId))
      .executeTakeFirst();
  }

  async deleteByAssetIds(ownerId: string, assetIds: string[]): Promise<number> {
    if (!assetIds.length) return 0;
    const rows = await this.db
      .selectFrom('auto_stack_candidate_asset')
      .innerJoin('auto_stack_candidate', 'auto_stack_candidate_asset.candidateId', 'auto_stack_candidate.id')
      .select(['auto_stack_candidate_asset.candidateId as id'])
      .where('auto_stack_candidate.ownerId', '=', asUuid(ownerId))
      .where('auto_stack_candidate_asset.assetId', 'in', assetIds)
      .execute();
    if (!rows.length) return 0;
    const ids = [...new Set(rows.map((r: any) => r.id))];
    await this.db.deleteFrom('auto_stack_candidate').where('id', 'in', ids).execute();
    return ids.length;
  }

  async listScores(ownerId: string): Promise<number[]> {
    const rows = await this.db
      .selectFrom('auto_stack_candidate')
      .select(['score'])
      .where('ownerId', '=', asUuid(ownerId))
      .where('dismissedAt', 'is', null)
      .execute();
    return rows.map((r: any) => r.score as number);
  }

  /** Count active (not dismissed/promoted) candidates created at or after the given timestamp */
  async countCreatedSince(ownerId: string, since: Date): Promise<number> {
    const row = await this.db
      .selectFrom('auto_stack_candidate')
      .select(({ fn }) => fn.count('id').as('cnt'))
      .where('ownerId', '=', asUuid(ownerId))
      .where('dismissedAt', 'is', null)
      .where('promotedStackId', 'is', null)
      .where('createdAt', '>=', since)
      .executeTakeFirst();
    return Number(row?.cnt || 0);
  }

  async getCandidateAssetIds(candidateId: string): Promise<string[]> {
    const rows = await this.db
      .selectFrom('auto_stack_candidate_asset')
      .select(['assetId'])
      .where('candidateId', '=', candidateId)
      .orderBy('position')
      .execute();
    return rows.map((r: any) => r.assetId as string);
  }

  async updateScore(candidateId: string, score: number, scoreComponents: Record<string, number>, avgCos?: number) {
    await this.db
      .updateTable('auto_stack_candidate')
      .set({ score, scoreComponents: JSON.stringify(scoreComponents || {}), avgCos })
      .where('id', '=', candidateId)
      .execute();
  }

  async getCandidateOwner(candidateId: string): Promise<string | null> {
    const row = await this.db
      .selectFrom('auto_stack_candidate')
      .select(['ownerId'])
      .where('id', '=', candidateId)
      .executeTakeFirst();
    return row ? (row.ownerId as string) : null;
  }

  /** Return candidate ids that contain any of the given asset ids for an owner (active only). */
  async listActiveIdsByAssetIds(ownerId: string, assetIds: string[]): Promise<string[]> {
    if (!assetIds.length) return [];
    const rows = await this.db
      .selectFrom('auto_stack_candidate_asset')
      .innerJoin('auto_stack_candidate', 'auto_stack_candidate_asset.candidateId', 'auto_stack_candidate.id')
      .select(['auto_stack_candidate_asset.candidateId as id'])
      .where('auto_stack_candidate.ownerId', '=', asUuid(ownerId))
      .where('auto_stack_candidate.dismissedAt', 'is', null)
      .where('auto_stack_candidate.promotedStackId', 'is', null)
      .where('auto_stack_candidate_asset.assetId', 'in', assetIds.map(asUuid))
      .execute();
    return [...new Set((rows as any[]).map((r) => r.id))];
  }

  /** Dismiss active candidates older than cutoff. Optionally only those under a score threshold. Returns count dismissed. */
  async dismissOlderThan(cutoff: Date, belowScore?: number): Promise<number> {
    const q = this.db
      .updateTable('auto_stack_candidate')
      .set({ dismissedAt: new Date() })
      .where('createdAt', '<', cutoff)
      .where('dismissedAt', 'is', null)
      .where('promotedStackId', 'is', null)
      .$if(!!belowScore, (qb: any) => qb.where('score', '<', belowScore!))
      .returning('id');
    const rows = await q.execute();
    return rows.length;
  }

  /** Delete all auto stack candidates (global). */
  async resetAll(): Promise<void> {
    await this.db.deleteFrom('auto_stack_candidate').execute();
  }
}
