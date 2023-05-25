import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSidecarFile1684273840676 implements MigrationInterface {
    name = 'AddSidecarFile1684273840676'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assets" ADD "sidecarPath" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "sidecarPath"`);
    }

}
