import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`DELETE FROM activity AS a
          WHERE a."assetId" IS NOT NULL
          AND NOT EXISTS (
            SELECT 1
              FROM public.albums_assets_assets AS aaa
              WHERE a."albumId" = aaa."albumsId"
              AND a."assetId" = aaa."assetsId"
        );`.execute(db);
  await sql`ALTER TABLE activity
        ADD CONSTRAINT fk_activity_album_asset_composite
        FOREIGN KEY ("albumId", "assetId")
        REFERENCES public.albums_assets_assets ("albumsId", "assetsId")
        ON UPDATE NO ACTION
        ON DELETE CASCADE;`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE activity
        DROP CONSTRAINT fk_activity_album_asset_composite;`.execute(db);
}
