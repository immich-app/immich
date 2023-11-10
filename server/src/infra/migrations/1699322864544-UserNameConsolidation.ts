import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUsername1699322864544 implements MigrationInterface {
    name = 'AddUsername1699322864544'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "name" character varying NOT NULL DEFAULT ''`);
        await queryRunner.query(`UPDATE "users" SET "name" = CONCAT(COALESCE("firstName", ''), ' ', COALESCE("lastName", ''))`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "firstName"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "lastName"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "lastName" character varying NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "users" ADD "firstName" character varying NOT NULL DEFAULT ''`);
        await queryRunner.query(`UPDATE "users" SET "lastName" = COALESCE("email", '')`);
        await queryRunner.query(`UPDATE "users" SET "firstName" = COALESCE("email", '')`);
    }

}
