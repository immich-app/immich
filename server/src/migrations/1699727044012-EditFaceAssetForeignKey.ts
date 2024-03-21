import { MigrationInterface, QueryRunner } from "typeorm";

export class EditFaceAssetForeignKey1699727044012 implements MigrationInterface {
    name = 'EditFaceAssetForeignKey1699727044012'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "person" DROP CONSTRAINT "FK_2bbabe31656b6778c6b87b61023"`);
        await queryRunner.query(`UPDATE person SET "faceAssetId" = asset_faces."id" FROM asset_faces WHERE person."faceAssetId" = asset_faces."assetId" AND person."id" = asset_faces."personId"`)
        await queryRunner.query(`ALTER TABLE "person" ADD CONSTRAINT "FK_2bbabe31656b6778c6b87b61023" FOREIGN KEY ("faceAssetId") REFERENCES "asset_faces"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "person" DROP CONSTRAINT "FK_2bbabe31656b6778c6b87b61023"`);
        await queryRunner.query(`UPDATE person SET "faceAssetId" = assets."id" FROM assets, asset_faces WHERE person."faceAssetId" = asset_faces."id" AND asset_faces."assetId" = assets."id"`);
        await queryRunner.query(`ALTER TABLE "person" ADD CONSTRAINT "FK_2bbabe31656b6778c6b87b61023" FOREIGN KEY ("faceAssetId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
