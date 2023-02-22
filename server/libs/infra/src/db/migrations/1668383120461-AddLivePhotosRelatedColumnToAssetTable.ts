import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLivePhotosRelatedColumnToAssetTable1668383120461 implements MigrationInterface {
    name = 'AddLivePhotosRelatedColumnToAssetTable1668383120461'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assets" ADD "isVisible" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "assets" ADD "livePhotoVideoId" uuid`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "livePhotoVideoId"`);
        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "isVisible"`);
    }

}
