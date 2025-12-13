import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "partners" ADD "createId" uuid NOT NULL DEFAULT immich_uuid_v7();`.execute(db);
  await sql`UPDATE "partners" SET "createId" = immich_uuid_v7("createdAt")`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "partners" DROP COLUMN "createId";`.execute(db);
}
