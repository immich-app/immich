import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLibraryReadOnly1714513984514 implements MigrationInterface {
    name = 'AddLibraryReadOnly1714513984514'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "libraries" ADD "isReadOnly" boolean NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "libraries" DROP COLUMN "isReadOnly"`);
    }

}
