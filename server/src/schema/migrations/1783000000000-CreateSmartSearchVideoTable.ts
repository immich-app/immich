import { Kysely, sql } from 'kysely';
import { getVectorExtension } from 'src/repositories/database.repository';
import { vectorIndexQuery } from 'src/utils/database';

export async function up(db: Kysely<any>): Promise<void> {
  const vectorExtension = await getVectorExtension(db);

  await sql`CREATE TABLE "smart_search_video" (
    "assetId" uuid NOT NULL,
    "frameIndex" integer NOT NULL,
    "timestamp" integer NOT NULL,
    "embedding" vector(512) NOT NULL
  );`.execute(db);

  await sql`ALTER TABLE "smart_search_video" ALTER COLUMN "embedding" SET STORAGE EXTERNAL;`.execute(db);

  await sql`ALTER TABLE "smart_search_video" ADD CONSTRAINT "smart_search_video_pkey" PRIMARY KEY ("assetId", "frameIndex");`.execute(
    db,
  );

  await sql`ALTER TABLE "smart_search_video" ADD CONSTRAINT "smart_search_video_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets" ("id") ON UPDATE NO ACTION ON DELETE CASCADE;`.execute(
    db,
  );

  await sql.raw(vectorIndexQuery({ vectorExtension, table: 'smart_search_video', indexName: 'clip_video_index' })).execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TABLE "smart_search_video";`.execute(db);
}
