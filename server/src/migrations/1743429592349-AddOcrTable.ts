import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOcrTable1743429592349 implements MigrationInterface {
  name = 'AddOcrTable1743429592349';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "asset_ocr"
      (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "assetId" uuid NOT NULL,
        "text" text,
        CONSTRAINT "PK_asset_ocr_id" PRIMARY KEY ("id")
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "asset_ocr" DROP CONSTRAINT "FK_asset_ocr_assetId"`);
    await queryRunner.query(`DROP TABLE "asset_ocr"`);
  }
}
