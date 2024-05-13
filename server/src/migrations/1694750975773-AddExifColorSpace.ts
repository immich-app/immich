import { MigrationInterface, QueryRunner } from "typeorm";

export class AddExifColorSpace1694750975773 implements MigrationInterface {
    name = 'AddExifColorSpace1694750975773'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "exif" ADD "profileDescription" character varying`);
        await queryRunner.query(`ALTER TABLE "exif" ADD "colorspace" character varying`);
        await queryRunner.query(`ALTER TABLE "exif" ADD "bitsPerSample" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "exif" DROP COLUMN "bitsPerSample"`);
        await queryRunner.query(`ALTER TABLE "exif" DROP COLUMN "colorspace"`);
        await queryRunner.query(`ALTER TABLE "exif" DROP COLUMN "profileDescription"`);
    }

}
