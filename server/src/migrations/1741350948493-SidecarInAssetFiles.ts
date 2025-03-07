import { MigrationInterface, QueryRunner } from 'typeorm';

export class SidecarInAssetFiles1741350948493 implements MigrationInterface {
  name = 'SidecarInAssetFiles1741350948493';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "asset_files" DROP CONSTRAINT "UQ_assetId_type"`);
    await queryRunner.query(`ALTER TABLE "asset_files" ADD "libraryId" uuid`);
    await queryRunner.query(`ALTER TABLE "asset_files" ADD "fileCreatedAt" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(`ALTER TABLE "asset_files" DROP CONSTRAINT "FK_e3e103a5f1d8bc8402999286040"`);
    await queryRunner.query(`ALTER TABLE "asset_files" ALTER COLUMN "assetId" DROP NOT NULL`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_libraryId_path" ON "asset_files" ("libraryId", "path") WHERE "libraryId" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_assetId_type" ON "asset_files" ("assetId", "type") WHERE "type" <> 'sidecar'`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_files" ADD CONSTRAINT "FK_e3e103a5f1d8bc8402999286040" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_files" ADD CONSTRAINT "FK_0c24f2d55ad980d49fe36caafdc" FOREIGN KEY ("libraryId") REFERENCES "libraries"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "asset_files" DROP CONSTRAINT "FK_0c24f2d55ad980d49fe36caafdc"`);
    await queryRunner.query(`ALTER TABLE "asset_files" DROP CONSTRAINT "FK_e3e103a5f1d8bc8402999286040"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_assetId_type"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_libraryId_path"`);
    await queryRunner.query(`ALTER TABLE "asset_files" ALTER COLUMN "assetId" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "asset_files" ADD CONSTRAINT "FK_e3e103a5f1d8bc8402999286040" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(`ALTER TABLE "asset_files" DROP COLUMN "fileCreatedAt"`);
    await queryRunner.query(`ALTER TABLE "asset_files" DROP COLUMN "libraryId"`);
    await queryRunner.query(`ALTER TABLE "asset_files" ADD CONSTRAINT "UQ_assetId_type" UNIQUE ("assetId", "type")`);
  }
}
