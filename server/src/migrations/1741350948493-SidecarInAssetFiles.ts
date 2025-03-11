import { MigrationInterface, QueryRunner } from 'typeorm';

export class SidecarInAssetFiles1741350948493 implements MigrationInterface {
  name = 'SidecarInAssetFiles1741350948493';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "asset_files" ADD "fileCreatedAt" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(`ALTER TABLE "asset_files" ALTER COLUMN "assetId" DROP NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "asset_files" ALTER COLUMN "assetId" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "asset_files" DROP COLUMN "fileCreatedAt"`);
  }
}
