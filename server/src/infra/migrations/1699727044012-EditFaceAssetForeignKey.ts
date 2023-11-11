import { MigrationInterface, QueryRunner } from "typeorm";

export class EditFaceAssetForeignKey1699727044012 implements MigrationInterface {
    name = 'EditFaceAssetForeignKey1699727044012'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "person" DROP CONSTRAINT "FK_2bbabe31656b6778c6b87b61023"`);
        await queryRunner.query(`ALTER TABLE "person" ADD CONSTRAINT "FK_2bbabe31656b6778c6b87b61023" FOREIGN KEY ("faceAssetId") REFERENCES "asset_faces"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "person" DROP CONSTRAINT "FK_2bbabe31656b6778c6b87b61023"`);
        await queryRunner.query(`ALTER TABLE "person" ADD CONSTRAINT "FK_2bbabe31656b6778c6b87b61023" FOREIGN KEY ("faceAssetId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
