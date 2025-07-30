import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "group_user" DROP CONSTRAINT "group_user_groupId_fkey";`.execute(db);
  await sql`ALTER TABLE "group_user" ADD CONSTRAINT "group_user_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "group" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "group_user" DROP CONSTRAINT "group_user_groupId_fkey";`.execute(db);
  await sql`ALTER TABLE "group_user" ADD CONSTRAINT "group_user_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "album" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(db);
}
