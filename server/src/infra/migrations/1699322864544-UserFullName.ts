import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserFullName1699322864544 implements MigrationInterface {
    name = 'AddUserFullName1699322864544'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "fullName" character varying NOT NULL DEFAULT ''`);
        await queryRunner.query(`UPDATE "users" SET "fullName" = CONCAT(COALESCE("firstName", ''), '', COALESCE("lastName", ''))`)
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "firstName"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "lastName"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "fullName"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "lastName" character varying NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "users" ADD "firstName" character varying NOT NULL DEFAULT ''`);
    }

}
