import { MigrationInterface, QueryRunner } from "typeorm";

export class Infra1692880809207 implements MigrationInterface {
    name = 'Infra1692880809207'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "interactiveLoginEnabled" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users" ADD "sharedAccountId" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "sharedAccountId"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "interactiveLoginEnabled"`);
    }

}
