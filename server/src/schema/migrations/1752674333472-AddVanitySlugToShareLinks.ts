import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "shared_link" ADD "slug" character varying UNIQUE;`.execute(db);
  await sql`ALTER TABLE "shared_link" RENAME CONSTRAINT "shared_link_slug_key" TO "shared_link_slug_uq";`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "shared_link" DROP COLUMN "slug";`.execute(db);
}
