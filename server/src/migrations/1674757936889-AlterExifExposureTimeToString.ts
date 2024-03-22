import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterExifExposureTimeToString1674757936889 implements MigrationInterface {
    name = 'AlterExifExposureTimeToString1674757936889'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "exif" DROP COLUMN "exposureTime"`);
        await queryRunner.query(`ALTER TABLE "exif" ADD "exposureTime" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "exif" DROP COLUMN "exposureTime"`);
        await queryRunner.query(`ALTER TABLE "exif" ADD "exposureTime" double precision`);
    }

}
