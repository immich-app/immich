import { MigrationInterface, QueryRunner } from "typeorm";

export class DropSaltColumn1672109862870 implements MigrationInterface {
    name = 'DropSaltColumn1672109862870'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "salt"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "salt" character varying NOT NULL DEFAULT ''`);
    }

}
