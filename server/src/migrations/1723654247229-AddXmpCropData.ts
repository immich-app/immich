import { MigrationInterface, QueryRunner } from "typeorm";

export class AddXmpCropData1723654247229 implements MigrationInterface {
    name = 'AddXmpCropData1723654247229'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "exif" ADD "cropLeft" integer`);
        await queryRunner.query(`ALTER TABLE "exif" ADD "cropTop" integer`);
        await queryRunner.query(`ALTER TABLE "exif" ADD "cropWidth" integer`);
        await queryRunner.query(`ALTER TABLE "exif" ADD "cropHeight" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "exif" DROP COLUMN "cropHeight"`);
        await queryRunner.query(`ALTER TABLE "exif" DROP COLUMN "cropWidth"`);
        await queryRunner.query(`ALTER TABLE "exif" DROP COLUMN "cropTop"`);
        await queryRunner.query(`ALTER TABLE "exif" DROP COLUMN "cropLeft"`);
    }

}
