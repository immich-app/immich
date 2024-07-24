import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveLibraryIsVisible1715798702876 implements MigrationInterface {
    name = 'RemoveLibraryIsVisible1715798702876'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "libraries" DROP COLUMN "isVisible"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "libraries" ADD "isVisible" boolean NOT NULL DEFAULT true`);
    }

}
