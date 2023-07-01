import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDetectFaceResultInfo1688241394489 implements MigrationInterface {
  name = 'AddDetectFaceResultInfo1688241394489';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "asset_faces" ADD "imageWidth" integer NOT NULL DEFAULT '0'`);
    await queryRunner.query(`ALTER TABLE "asset_faces" ADD "imageHeight" integer NOT NULL DEFAULT '0'`);
    await queryRunner.query(`ALTER TABLE "asset_faces" ADD "boundingBoxX1" integer NOT NULL DEFAULT '0'`);
    await queryRunner.query(`ALTER TABLE "asset_faces" ADD "boundingBoxY1" integer NOT NULL DEFAULT '0'`);
    await queryRunner.query(`ALTER TABLE "asset_faces" ADD "boundingBoxX2" integer NOT NULL DEFAULT '0'`);
    await queryRunner.query(`ALTER TABLE "asset_faces" ADD "boundingBoxY2" integer NOT NULL DEFAULT '0'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "asset_faces" DROP COLUMN "boundingBoxY2"`);
    await queryRunner.query(`ALTER TABLE "asset_faces" DROP COLUMN "boundingBoxX2"`);
    await queryRunner.query(`ALTER TABLE "asset_faces" DROP COLUMN "boundingBoxY1"`);
    await queryRunner.query(`ALTER TABLE "asset_faces" DROP COLUMN "boundingBoxX1"`);
    await queryRunner.query(`ALTER TABLE "asset_faces" DROP COLUMN "imageHeight"`);
    await queryRunner.query(`ALTER TABLE "asset_faces" DROP COLUMN "imageWidth"`);
  }
}
