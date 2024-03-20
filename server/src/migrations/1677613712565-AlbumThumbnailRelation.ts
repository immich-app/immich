import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlbumThumbnailRelation1677613712565 implements MigrationInterface {
  name = 'AlbumThumbnailRelation1677613712565';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Make sure all albums have a valid albumThumbnailAssetId UUID or NULL.
    await queryRunner.query(`
      UPDATE "albums"
      SET
        "albumThumbnailAssetId" = (
            SELECT
              "albums_assets2"."assetsId"
            FROM
              "assets" "assets",
              "albums_assets_assets" "albums_assets2"
            WHERE
                "albums_assets2"."assetsId" = "assets"."id"
                AND "albums_assets2"."albumsId" = "albums"."id"
            ORDER BY
              "assets"."fileCreatedAt" DESC
            LIMIT 1
        ),
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE
        "albums"."albumThumbnailAssetId" IS NULL
        AND EXISTS (
            SELECT 1
            FROM "albums_assets_assets" "albums_assets"
            WHERE "albums"."id" = "albums_assets"."albumsId"
        )
        OR "albums"."albumThumbnailAssetId" IS NOT NULL
        AND NOT EXISTS (
          SELECT 1
          FROM "albums_assets_assets" "albums_assets"
          WHERE
            "albums"."id" = "albums_assets"."albumsId"
            AND "albums"."albumThumbnailAssetId" = "albums_assets"."assetsId"::varchar
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "albums"
      ALTER COLUMN "albumThumbnailAssetId"
      TYPE uuid USING "albumThumbnailAssetId"::uuid
    `);

    await queryRunner.query(`
      ALTER TABLE "albums" ADD CONSTRAINT "FK_05895aa505a670300d4816debce" FOREIGN KEY ("albumThumbnailAssetId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "albums" DROP CONSTRAINT "FK_05895aa505a670300d4816debce"`);

    await queryRunner.query(`
      ALTER TABLE "albums" ALTER COLUMN "albumThumbnailAssetId" TYPE varchar USING "albumThumbnailAssetId"::varchar
    `);
  }
}
