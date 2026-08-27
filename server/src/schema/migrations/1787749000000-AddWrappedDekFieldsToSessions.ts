import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "session" ADD "wrappedDek" character varying;`.execute(db);
  await sql`ALTER TABLE "session" ADD "dekNonce" character varying;`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "session" DROP COLUMN "wrappedDek";`.execute(db);
  await sql`ALTER TABLE "session" DROP COLUMN "dekNonce";`.execute(db);
}
