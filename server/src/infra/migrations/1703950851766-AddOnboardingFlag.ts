import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOnboardingFlag1703950851766 implements MigrationInterface {
    name = 'AddOnboardingFlag1703950851766'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "showOnboarding" boolean NOT NULL DEFAULT true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "showOnboarding"`);
    }

}
