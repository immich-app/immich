import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsArchivedColumn1680632845740 implements MigrationInterface {
    name = 'AddIsArchivedColumn1680632845740'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assets" ADD "isArchived" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "isArchived"`);
    }

}
