import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAssetDuplicateColumns1711989989911 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE assets ADD COLUMN "duplicateId" uuid`);
    await queryRunner.query(`ALTER TABLE asset_job_status ADD COLUMN "duplicatesDetectedAt" timestamptz`);
    await queryRunner.query(`CREATE INDEX "IDX_assets_duplicateId" ON assets ("duplicateId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE assets DROP COLUMN "duplicateId"`);
    await queryRunner.query(`ALTER TABLE asset_job_status DROP COLUMN "duplicatesDetectedAt"`);
  }
}
