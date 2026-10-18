import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "shared_link" ADD "viewCount" integer NOT NULL DEFAULT 0;`.execute(db);
  await sql`ALTER TABLE "shared_link" ADD "downloadCount" integer NOT NULL DEFAULT 0;`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "shared_link" DROP COLUMN "viewCount";`.execute(db);
  await sql`ALTER TABLE "shared_link" DROP COLUMN "downloadCount";`.execute(db);
}
