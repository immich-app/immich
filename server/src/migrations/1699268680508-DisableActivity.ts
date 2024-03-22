import { MigrationInterface, QueryRunner } from "typeorm";

export class DisableActivity1699268680508 implements MigrationInterface {
    name = 'DisableActivity1699268680508'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "albums" ADD "isActivityEnabled" boolean NOT NULL DEFAULT true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "albums" DROP COLUMN "isActivityEnabled"`);
    }

}
