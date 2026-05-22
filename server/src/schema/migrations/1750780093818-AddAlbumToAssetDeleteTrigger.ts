import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE OR REPLACE FUNCTION album_assets_delete_audit()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      INSERT INTO album_assets_audit ("albumId", "assetId")
      SELECT "albumsId", "assetsId" FROM OLD
      WHERE "albumsId" IN (SELECT "id" FROM albums WHERE "id" IN (SELECT "albumsId" FROM OLD));
      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`ALTER TABLE "album_assets_audit" ADD CONSTRAINT "FK_8047b44b812619a3c75a2839b0d" FOREIGN KEY ("albumId") REFERENCES "albums" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "album_assets_delete_audit"
  AFTER DELETE ON "albums_assets_assets"
  REFERENCING OLD TABLE AS "old"
  FOR EACH STATEMENT
  WHEN (pg_trigger_depth() <= 1)
  EXECUTE FUNCTION album_assets_delete_audit();`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TRIGGER "album_assets_delete_audit" ON "albums_assets_assets";`.execute(db);
  await sql`ALTER TABLE "album_assets_audit" DROP CONSTRAINT "FK_8047b44b812619a3c75a2839b0d";`.execute(db);
  await sql`DROP FUNCTION album_assets_delete_audit;`.execute(db);
}
