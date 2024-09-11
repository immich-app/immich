import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddThumbnailJobStatus1724080823160 implements MigrationInterface {
  name = 'AddThumbnailJobStatus1724080823160';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "asset_job_status" ADD "previewAt" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(`ALTER TABLE "asset_job_status" ADD "thumbnailAt" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(`UPDATE "asset_job_status" SET "previewAt" = NOW() FROM "assets" WHERE "assetId" = "assets"."id" AND "assets"."previewPath" IS NOT NULL`);
    await queryRunner.query(`UPDATE "asset_job_status" SET "thumbnailAt" = NOW() FROM "assets" WHERE "assetId" = "assets"."id" AND "assets"."thumbnailPath" IS NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "asset_job_status" DROP COLUMN "thumbnailAt"`);
    await queryRunner.query(`ALTER TABLE "asset_job_status" DROP COLUMN "previewAt"`);
  }
}
