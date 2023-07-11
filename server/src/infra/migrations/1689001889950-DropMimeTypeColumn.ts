import { MigrationInterface, QueryRunner } from "typeorm";

export class DropMimeTypeColumn1689001889950 implements MigrationInterface {
    name = 'DropMimeTypeColumn1689001889950'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "mimeType"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assets" ADD "mimeType" character varying`);
    }

}
