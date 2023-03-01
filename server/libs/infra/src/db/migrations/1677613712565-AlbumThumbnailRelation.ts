import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlbumThumbnailRelation1677613712565 implements MigrationInterface {
  name = 'AlbumThumbnailRelation1677613712565';

  public async up(queryRunner: QueryRunner): Promise<void> {
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
