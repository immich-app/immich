import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "person_user" ADD CONSTRAINT "person_user_sharedBy_sharedWith_chk" CHECK ("sharedById" != "sharedWithId");`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "person_user" DROP CONSTRAINT "person_user_sharedBy_sharedWith_chk";`.execute(db);
}
