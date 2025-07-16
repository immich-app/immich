import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "albums_shared_users_users" ADD "createId" uuid NOT NULL DEFAULT immich_uuid_v7();`.execute(db);
  await sql`ALTER TABLE "albums_shared_users_users" ADD "createdAt" timestamp with time zone NOT NULL DEFAULT now();`.execute(db);
  await sql`CREATE INDEX "IDX_album_users_create_id" ON "albums_shared_users_users" ("createId")`.execute(db);
  await sql`CREATE INDEX "IDX_partners_create_id" ON "partners" ("createId")`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX "IDX_partners_create_id";`.execute(db);
  await sql`DROP INDEX "IDX_album_users_create_id";`.execute(db);
  await sql`ALTER TABLE "albums_shared_users_users" DROP COLUMN "createId";`.execute(db);
  await sql`ALTER TABLE "albums_shared_users_users" DROP COLUMN "createdAt";`.execute(db);
}
