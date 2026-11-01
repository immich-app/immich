import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "album" ADD "includePrivateAssets" boolean NOT NULL DEFAULT false;`.execute(db);
  await sql`ALTER TABLE "shared_link" ADD "includePrivateAssets" boolean NOT NULL DEFAULT false;`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "album" DROP COLUMN "includePrivateAssets";`.execute(db);
  await sql`ALTER TABLE "shared_link" DROP COLUMN "includePrivateAssets";`.execute(db);
}
