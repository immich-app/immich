import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "asset" ADD "encryptionNonce" character varying;`.execute(db);
  await sql`ALTER TABLE "asset" ADD "encryptionAuthTag" character varying;`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "asset" DROP COLUMN "encryptionNonce";`.execute(db);
  await sql`ALTER TABLE "asset" DROP COLUMN "encryptionAuthTag";`.execute(db);
}
