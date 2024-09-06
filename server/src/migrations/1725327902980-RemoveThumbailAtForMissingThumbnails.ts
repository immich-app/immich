import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveThumbailAtForMissingThumbnails1725327902980 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "asset_job_status" j SET "thumbnailAt" = NULL WHERE j."thumbnailAt" IS NOT NULL AND NOT EXISTS ( SELECT 1 FROM asset_files f WHERE j."assetId" = f."assetId" AND f."type" = 'thumbnail' AND f."path" IS NOT NULL )`,
    );
  }

  public async down(): Promise<void> {
    // do nothing
  }
}
