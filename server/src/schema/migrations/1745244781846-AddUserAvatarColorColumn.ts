import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "users" ADD "avatarColor" character varying;`.execute(db);
  await sql`
    UPDATE "users"
    SET "avatarColor" = "user_metadata"."value"->'avatar'->>'color'
    FROM "user_metadata"
    WHERE "users"."id" = "user_metadata"."userId" AND "user_metadata"."key" = 'preferences';`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "users" DROP COLUMN "avatarColor";`.execute(db);
}
