import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsLivePhotoToAssetTable1668291382254 implements MigrationInterface {
    name = 'AddIsLivePhotoToAssetTable1668291382254'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assets" ADD "isLivePhoto" boolean`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "isLivePhoto"`);
    }

}
