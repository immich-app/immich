import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAssetOrderToAllUsers1714599434392 implements MigrationInterface {
    name = 'AddAssetOrderToAllUsers1714599434392'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "preferedAlbumOrder" character varying NOT NULL DEFAULT 'desc'`);
        await queryRunner.query(`ALTER TABLE "albums" ALTER COLUMN "order" SET DEFAULT 'preference'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "albums" ALTER COLUMN "order" SET DEFAULT 'desc'`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "preferedAlbumOrder"`);
    }

}
