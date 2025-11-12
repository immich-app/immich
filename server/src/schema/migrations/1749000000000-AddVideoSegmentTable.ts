import { Kysely, sql } from 'kysely';
import { VectorIndex } from 'src/enum';
import { getVectorExtension } from 'src/repositories/database.repository';
import { vectorIndexQuery } from 'src/utils/database';

const TABLE_NAME = 'video_segment';
const ASSET_FK = 'FK_video_segment_asset';
const PK_NAME = 'PK_video_segment';
const ASSET_INDEX = 'video_segment_asset_idx';
const UPDATED_TRIGGER = 'video_segment_updatedAt';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE TABLE ${sql.table(TABLE_NAME)} (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "assetId" uuid NOT NULL,
    "segmentIndex" integer NOT NULL,
    "startTime" double precision NOT NULL,
    "endTime" double precision NOT NULL,
    "embedding" vector(512) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
    "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
    "updateId" uuid NOT NULL DEFAULT immich_uuid_v7()
  );`.execute(db);

  await sql`ALTER TABLE ${sql.table(TABLE_NAME)} ADD CONSTRAINT ${sql.raw(PK_NAME)} PRIMARY KEY ("id");`.execute(db);
  await sql`ALTER TABLE ${sql.table(TABLE_NAME)} ADD CONSTRAINT ${sql.raw(ASSET_FK)} FOREIGN KEY ("assetId") REFERENCES "asset" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(db);
  await sql`CREATE INDEX ${sql.raw(ASSET_INDEX)} ON ${sql.table(TABLE_NAME)} ("assetId");`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER ${sql.raw(UPDATED_TRIGGER)}
    BEFORE UPDATE ON ${sql.table(TABLE_NAME)}
    FOR EACH ROW
    EXECUTE FUNCTION updated_at();`.execute(db);

  const vectorExtension = await getVectorExtension(db as any);
  await sql`
    ALTER TABLE ${sql.table(TABLE_NAME)}
    ALTER COLUMN "embedding"
    SET STORAGE EXTERNAL
  `.execute(db);
  await sql.raw(
    vectorIndexQuery({ vectorExtension, table: TABLE_NAME, indexName: VectorIndex.VideoSegment }),
  ).execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX IF EXISTS ${sql.raw(VectorIndex.VideoSegment)};`.execute(db);
  await sql`DROP TRIGGER IF EXISTS ${sql.raw(UPDATED_TRIGGER)} ON ${sql.table(TABLE_NAME)};`.execute(db);
  await sql`DROP INDEX IF EXISTS ${sql.raw(ASSET_INDEX)};`.execute(db);
  await sql`ALTER TABLE ${sql.table(TABLE_NAME)} DROP CONSTRAINT IF EXISTS ${sql.raw(ASSET_FK)};`.execute(db);
  await sql`ALTER TABLE ${sql.table(TABLE_NAME)} DROP CONSTRAINT IF EXISTS ${sql.raw(PK_NAME)};`.execute(db);
  await sql`DROP TABLE IF EXISTS ${sql.table(TABLE_NAME)};`.execute(db);
}
