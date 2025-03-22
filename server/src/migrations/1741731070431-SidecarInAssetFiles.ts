import { MigrationInterface, QueryRunner } from 'typeorm';

export class Test1741731070431 implements MigrationInterface {
  name = 'Test1741731070431';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "sidecarPath"`);
    await queryRunner.query(`ALTER TABLE "asset_files" ADD "fileModifiedAt" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(`ALTER TABLE "asset_files" DROP CONSTRAINT "FK_e3e103a5f1d8bc8402999286040"`);
    await queryRunner.query(`ALTER TABLE "asset_files" DROP CONSTRAINT "UQ_assetId_type"`);
    await queryRunner.query(`ALTER TABLE "asset_files" ALTER COLUMN "assetId" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "asset_files" ADD CONSTRAINT "UQ_assetId_type" UNIQUE ("assetId", "type")`);
    await queryRunner.query(
      `ALTER TABLE "asset_files" ADD CONSTRAINT "FK_e3e103a5f1d8bc8402999286040" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "assets" ADD "sidecarPath" character varying`);
    await queryRunner.query(`ALTER TABLE "asset_files" DROP CONSTRAINT "FK_e3e103a5f1d8bc8402999286040"`);
    await queryRunner.query(`ALTER TABLE "asset_files" DROP CONSTRAINT "UQ_assetId_type"`);
    await queryRunner.query(`ALTER TABLE "asset_files" ALTER COLUMN "assetId" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "asset_files" ADD CONSTRAINT "UQ_assetId_type" UNIQUE ("assetId", "type")`);
    await queryRunner.query(
      `ALTER TABLE "asset_files" ADD CONSTRAINT "FK_e3e103a5f1d8bc8402999286040" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(`ALTER TABLE "asset_files" DROP COLUMN "fileModifiedAt"`);
  }
}
