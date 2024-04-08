import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLibraryReadOnly1712293452361 implements MigrationInterface {
    name = 'AddLibraryReadOnly1712293452361'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "libraries" ADD "isReadOnly" boolean`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "libraries" DROP COLUMN "isReadOnly"`);
    }

}
