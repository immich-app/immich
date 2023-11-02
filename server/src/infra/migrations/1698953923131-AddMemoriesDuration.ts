import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMemoriesDuration1698953923131 implements MigrationInterface {
    name = 'AddMemoriesDuration1698953923131'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "memoriesDuration" integer NOT NULL DEFAULT '3'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "memoriesDuration"`);
    }

}
