import { MigrationInterface, QueryRunner } from "typeorm"

export class AddPersonFaceAssetId1693833336881 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "person" ADD "faceAssetId" uuid`);
    await queryRunner.query(`ALTER TABLE "person" ADD CONSTRAINT "FK_ab768006fba24450b92ead70700" FOREIGN KEY ("faceAssetId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "person" DROP CONSTRAINT "FK_ab768006fba24450b92ead70700"`);
    await queryRunner.query(`ALTER TABLE "person" DROP COLUMN "faceAssetId"`);
  }

}
