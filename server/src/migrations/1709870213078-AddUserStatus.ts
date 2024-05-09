import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserStatus1709870213078 implements MigrationInterface {
    name = 'AddUserStatus1709870213078'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "status" character varying NOT NULL DEFAULT 'active'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "status"`);
    }

}
