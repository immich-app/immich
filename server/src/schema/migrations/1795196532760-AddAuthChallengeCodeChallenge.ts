import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "auth_challenge" ADD "codeChallenge" character varying;`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "auth_challenge" DROP COLUMN "codeChallenge";`.execute(db);
}
