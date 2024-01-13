import { MigrationInterface, QueryRunner } from "typeorm";

export class AddQuotaColumnsToUser1704382918223 implements MigrationInterface {
    name = 'AddQuotaColumnsToUser1704382918223'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "quotaSizeInBytes" bigint`);
        await queryRunner.query(`ALTER TABLE "users" ADD "quotaUsageInBytes" bigint NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "quotaUsageInBytes"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "quotaSizeInBytes"`);
    }

}
