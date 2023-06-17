import { MigrationInterface, QueryRunner } from "typeorm";

export class ImportAsset1686584273471 implements MigrationInterface {
    name = 'ImportAsset1686584273471'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assets" ADD "isReadOnly" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "assets" ADD CONSTRAINT "UQ_4ed4f8052685ff5b1e7ca1058ba" UNIQUE ("originalPath")`);
        await queryRunner.query(`ALTER TABLE "users" ADD "externalPath" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assets" DROP CONSTRAINT "UQ_4ed4f8052685ff5b1e7ca1058ba"`);
        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "isReadOnly"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "externalPath"`);
    }

}
