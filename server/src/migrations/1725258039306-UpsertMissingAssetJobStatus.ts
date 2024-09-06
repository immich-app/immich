import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpsertMissingAssetJobStatus1725258039306 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "asset_job_status" ("assetId", "facesRecognizedAt", "metadataExtractedAt", "duplicatesDetectedAt", "previewAt", "thumbnailAt") SELECT "assetId", NULL, NULL, NULL, NULL, NULL FROM "asset_files" f WHERE "f"."path" IS NOT NULL ON CONFLICT DO NOTHING`,
    );

    await queryRunner.query(
      `UPDATE "asset_job_status" SET "previewAt" = NOW() FROM "asset_files" f WHERE "previewAt" IS NULL AND "asset_job_status"."assetId" = "f"."assetId" AND "f"."type" = 'preview' AND "f"."path" IS NOT NULL`,
    );

    await queryRunner.query(
      `UPDATE "asset_job_status" SET "thumbnailAt" = NOW() FROM "asset_files" f WHERE "thumbnailAt" IS NULL AND "asset_job_status"."assetId" = "f"."assetId" AND "f"."type" = 'thumbnail' AND "f"."path" IS NOT NULL`,
    );
  }

  public async down(): Promise<void> {
    // do nothing
  }
}
