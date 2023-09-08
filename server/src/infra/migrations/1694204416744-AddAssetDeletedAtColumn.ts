import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAssetDeletedAtColumn1694204416744 implements MigrationInterface {
    name = 'AddAssetDeletedAtColumn1694204416744'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assets" ADD "deletedAt" TIMESTAMP WITH TIME ZONE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "deletedAt"`);
    }

}
