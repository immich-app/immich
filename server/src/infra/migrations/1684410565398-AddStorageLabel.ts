import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStorageLabel1684410565398 implements MigrationInterface {
    name = 'AddStorageLabel1684410565398'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "storageLabel" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_b309cf34fa58137c416b32cea3a" UNIQUE ("storageLabel")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_b309cf34fa58137c416b32cea3a"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "storageLabel"`);
    }

}
