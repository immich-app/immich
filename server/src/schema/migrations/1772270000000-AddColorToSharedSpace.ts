import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "shared_space" ADD "color" character varying(20)`.execute(db);
  await sql`UPDATE "shared_space" SET "color" = 'primary' WHERE "color" IS NULL`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "shared_space" DROP COLUMN "color"`.execute(db);
}
