import { MigrationInterface, QueryRunner } from "typeorm";

export class LibraryWatch1704500692611 implements MigrationInterface {
    name = 'LibraryWatch1704500692611'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "libraries" ADD "watched" boolean NOT NULL DEFAULT true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "libraries" DROP COLUMN "watched"`);
    }

}
