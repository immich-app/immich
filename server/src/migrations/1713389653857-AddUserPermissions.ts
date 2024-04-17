import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserPermissions1713389653857 implements MigrationInterface {
    name = 'AddUserPermissions1713389653857'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "permissions" character varying array NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "permissions"`);
    }

}
