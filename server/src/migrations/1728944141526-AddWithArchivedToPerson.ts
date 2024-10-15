import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWithArchivedToPerson1728944141526 implements MigrationInterface {
    name = 'AddWithArchivedToPerson1728944141526'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "person" ADD "withArchived" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "person" DROP COLUMN "withArchived"`);
    }

}
