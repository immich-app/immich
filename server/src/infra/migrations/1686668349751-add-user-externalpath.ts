import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserExternalpath1686668349751 implements MigrationInterface {
    name = 'AddUserExternalpath1686668349751'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "externalPath" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "externalPath"`);
    }

}
