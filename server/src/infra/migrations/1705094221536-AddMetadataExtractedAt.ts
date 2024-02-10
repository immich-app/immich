import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMetadataExtractedAt1705094221536 implements MigrationInterface {
  name = 'AddMetadataExtractedAt1705094221536';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "asset_job_status" ADD "metadataExtractedAt" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(`
      UPDATE "asset_job_status"
      SET "metadataExtractedAt" = NOW()
      FROM "exif"
      WHERE "exif"."assetId" = "asset_job_status"."assetId";
`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "asset_job_status" DROP COLUMN "metadataExtractedAt"`);
  }
}
