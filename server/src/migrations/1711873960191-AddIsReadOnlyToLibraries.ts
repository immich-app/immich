import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsReadOnlyToLibraries1711873960191 implements MigrationInterface {
    name = 'AddIsReadOnlyToLibraries1711873960191'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "libraries" ADD "isReadOnly" boolean NOT NULL DEFAULT true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "libraries" DROP COLUMN "isReadOnly"`);
    }

}
