import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOcrInfo1672722545048 implements MigrationInterface {
    name = 'AddOcrInfo1672722545048'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "smart_info" ADD "ocr_string" text`);
        await queryRunner.query(`ALTER TABLE "smart_info" ADD "ocr_info" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "smart_info" DROP COLUMN "ocr_info"`);
        await queryRunner.query(`ALTER TABLE "smart_info" DROP COLUMN "ocr_string"`);
    }

}
