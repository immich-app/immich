import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "sessions" ADD "expiredAt" timestamp with time zone;`.execute(db);
  await sql`ALTER TABLE "sessions" ADD "parentId" uuid;`.execute(db);
  await sql`ALTER TABLE "sessions" ADD CONSTRAINT "FK_afbbabbd7daf5b91de4dca84de8" FOREIGN KEY ("parentId") REFERENCES "sessions" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(db);
  await sql`CREATE INDEX "IDX_afbbabbd7daf5b91de4dca84de" ON "sessions" ("parentId")`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX "IDX_afbbabbd7daf5b91de4dca84de";`.execute(db);
  await sql`ALTER TABLE "sessions" DROP CONSTRAINT "FK_afbbabbd7daf5b91de4dca84de8";`.execute(db);
  await sql`ALTER TABLE "sessions" DROP COLUMN "expiredAt";`.execute(db);
  await sql`ALTER TABLE "sessions" DROP COLUMN "parentId";`.execute(db);
}
