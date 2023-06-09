import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDeviceInfoToUserToken1682371791038 implements MigrationInterface {
    name = 'AddDeviceInfoToUserToken1682371791038'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_token" ADD "deviceType" character varying NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "user_token" ADD "deviceOS" character varying NOT NULL DEFAULT ''`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_token" DROP COLUMN "deviceOS"`);
        await queryRunner.query(`ALTER TABLE "user_token" DROP COLUMN "deviceType"`);
    }

}
