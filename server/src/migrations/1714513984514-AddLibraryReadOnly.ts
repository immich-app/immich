import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLibraryReadOnly1714513984514 implements MigrationInterface {
    name = 'AddLibraryReadOnly1714513984514'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "libraries" ADD "isReadOnly" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`UPDATE libraries SET "isReadOnly" = true WHERE type = 'EXTERNAL'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "libraries" DROP COLUMN "isReadOnly"`);
    }

}
