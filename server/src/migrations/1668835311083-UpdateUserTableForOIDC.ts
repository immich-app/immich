import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateUserTableForOIDC1668835311083 implements MigrationInterface {
    name = 'UpdateUserTableForOIDC1668835311083'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "password" SET DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "salt" SET DEFAULT ''`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "salt" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "password" DROP DEFAULT`);
    }

}
