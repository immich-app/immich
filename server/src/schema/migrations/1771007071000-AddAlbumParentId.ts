import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "album" ADD "parentId" uuid;`.execute(db);
  await sql`ALTER TABLE "album" ADD CONSTRAINT "FK_album_parentId" FOREIGN KEY ("parentId") REFERENCES "album"("id") ON DELETE SET NULL ON UPDATE CASCADE;`.execute(db);
  await sql`CREATE INDEX "IDX_album_parentId" ON "album" ("parentId");`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX "IDX_album_parentId";`.execute(db);
  await sql`ALTER TABLE "album" DROP CONSTRAINT "FK_album_parentId";`.execute(db);
  await sql`ALTER TABLE "album" DROP COLUMN "parentId";`.execute(db);
}
