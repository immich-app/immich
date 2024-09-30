import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAssetStatus1726593009549 implements MigrationInterface {
    name = 'AddAssetStatus1726593009549'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "assets_status_enum" AS ENUM('active', 'trashed', 'deleted')`);
        await queryRunner.query(`ALTER TABLE "assets" ADD "status" "assets_status_enum" NOT NULL DEFAULT 'active'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "assets_status_enum"`);
    }

}
