import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "workflow" ADD "updateId" uuid NOT NULL DEFAULT immich_uuid_v7();`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "workflow" DROP COLUMN "updateId";`.execute(db);
}
