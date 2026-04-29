import { Injectable } from '@nestjs/common';
import { Kysely, sql } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DB } from 'src/schema';

export interface LogDownloadDto {
  assetId: string;
  userId?: string | null;
  ipAddress?: string | null;
}

export interface TopDownloadedAsset {
  assetId: string;
  count: number;
}

export interface DownloadTimeBucket {
  bucket: Date;
  count: number;
}

// The asset_download_log table is created by migration but not in the typed schema.
// We use raw SQL queries for full type safety.
@Injectable()
export class DownloadStatsRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  async log({ assetId, userId, ipAddress }: LogDownloadDto): Promise<void> {
    await sql`
      INSERT INTO "asset_download_log" ("assetId", "userId", "ipAddress")
      VALUES (${assetId}::uuid, ${userId ?? null}::uuid, ${ipAddress ?? null})
    `.execute(this.db);
  }

  async getCountForAsset(assetId: string): Promise<number> {
    const result = await sql<{ count: string }>`
      SELECT COUNT(*)::text AS count FROM "asset_download_log" WHERE "assetId" = ${assetId}::uuid
    `.execute(this.db);
    return Number(result.rows[0]?.count ?? 0);
  }

  async getTotalForUser(userId: string): Promise<number> {
    const result = await sql<{ count: string }>`
      SELECT COUNT(*)::text AS count
      FROM "asset_download_log" l
      INNER JOIN "asset" a ON a."id" = l."assetId"
      WHERE a."ownerId" = ${userId}::uuid
    `.execute(this.db);
    return Number(result.rows[0]?.count ?? 0);
  }

  async getTopForUser(userId: string, limit = 10, sinceDays = 30): Promise<TopDownloadedAsset[]> {
    const result = await sql<{ assetId: string; count: string }>`
      SELECT l."assetId" AS "assetId", COUNT(*)::text AS count
      FROM "asset_download_log" l
      INNER JOIN "asset" a ON a."id" = l."assetId"
      WHERE a."ownerId" = ${userId}::uuid
        AND l."downloadedAt" >= now() - make_interval(days => ${sinceDays})
      GROUP BY l."assetId"
      ORDER BY count DESC
      LIMIT ${limit}
    `.execute(this.db);
    return result.rows.map((r) => ({ assetId: r.assetId, count: Number(r.count) }));
  }

  async getTimeSeriesForUser(
    userId: string,
    sinceDays = 30,
    granularity: 'day' | 'week' | 'month' = 'day',
  ): Promise<DownloadTimeBucket[]> {
    // sql.raw is safe here because granularity is constrained by the DTO validator
    const result = await sql<{ bucket: Date; count: string }>`
      SELECT date_trunc(${sql.lit(granularity)}, l."downloadedAt") AS bucket, COUNT(*)::text AS count
      FROM "asset_download_log" l
      INNER JOIN "asset" a ON a."id" = l."assetId"
      WHERE a."ownerId" = ${userId}::uuid
        AND l."downloadedAt" >= now() - make_interval(days => ${sinceDays})
      GROUP BY bucket
      ORDER BY bucket ASC
    `.execute(this.db);
    return result.rows.map((r) => ({ bucket: r.bucket, count: Number(r.count) }));
  }
}
