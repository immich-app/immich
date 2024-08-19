import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWatermark1724023703394 implements MigrationInterface {
  name = 'AddWatermark1724023703394';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "assets" ADD "watermarkedPreviewPath" character varying`);
    await queryRunner.query(`ALTER TABLE "assets" ADD "watermarkedThumbnailPath" character varying DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "shared_links" ADD "watermark" boolean NOT NULL DEFAULT false`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "watermarkedThumbnailPath"`);
    await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "watermarkedPreviewPath"`);
    await queryRunner.query(`ALTER TABLE "shared_links" DROP COLUMN "watermark"`);
  }
}
