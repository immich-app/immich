import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpsertOcrAssetJobStatus1743429240851 implements MigrationInterface {
  name = 'UpsertOcrAssetJobStatus1743429240851';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE asset_job_status
      ADD COLUMN IF NOT EXISTS "ocrAt" TIMESTAMP WITH TIME ZONE;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE asset_job_status
      DROP COLUMN IF EXISTS "ocrAt";
    `);
  }
}
