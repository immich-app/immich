import { MigrationInterface, QueryRunner } from "typeorm"

export class AddPersonFaceAssetId1693833336881 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "person" ADD "faceAssetId" uuid CONSTRAINT "FK_ab768006fba24450b92ead70700" REFERENCES assets(id) ON DELETE SET NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "person" DROP COLUMN "faceAssetId"`);
  }

}
