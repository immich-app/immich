import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "user" ADD "wrappedDek" character varying;`.execute(db);
  await sql`ALTER TABLE "user" ADD "kekSalt" character varying;`.execute(db);
  await sql`ALTER TABLE "user" ADD "kekNonce" character varying;`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "user" DROP COLUMN "wrappedDek";`.execute(db);
  await sql`ALTER TABLE "user" DROP COLUMN "kekSalt";`.execute(db);
  await sql`ALTER TABLE "user" DROP COLUMN "kekNonce";`.execute(db);
}
