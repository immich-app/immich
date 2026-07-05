import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "asset" DROP COLUMN "deviceAssetId";`.execute(db);
  await sql`ALTER TABLE "asset" DROP COLUMN "deviceId";`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "asset" ADD "deviceAssetId" character varying NOT NULL;`.execute(db);
  await sql`ALTER TABLE "asset" ADD "deviceId" character varying NOT NULL;`.execute(db);
}
