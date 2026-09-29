import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "plugin" ADD "templates" jsonb NOT NULL DEFAULT '[]';`.execute(db);
  await sql`ALTER TABLE "plugin" ADD "sha256hash" bytea NOT NULL DEFAULT decode('20464b37ad726d03d878d38d873c40a52d1fdfb754feda956ebb464afd689e2f', 'hex');`.execute(db);
  await sql`ALTER TABLE "plugin" ALTER COLUMN "sha256hash" DROP DEFAULT;`.execute(db);
  await sql`ALTER TABLE "plugin" ALTER COLUMN "templates" DROP DEFAULT;`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "plugin" DROP COLUMN "templates";`.execute(db);
  await sql`ALTER TABLE "plugin" DROP COLUMN "sha256hash";`.execute(db);
}
