import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrientationEnum1726754669860 implements MigrationInterface {
    name = 'AddOrientationEnum1726754669860'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "exif_orientation_enum" AS ENUM('1', '2', '3', '4', '5', '6', '7', '8')`)
        await queryRunner.query(`
            UPDATE "exif" SET "orientation" = CASE
            WHEN "orientation" = '0' THEN '1'
            WHEN "orientation" = '1' THEN '1'
            WHEN "orientation" = '2' THEN '2'
            WHEN "orientation" = '3' THEN '3'
            WHEN "orientation" = '4' THEN '4'
            WHEN "orientation" = '5' THEN '5'
            WHEN "orientation" = '6' THEN '6'
            WHEN "orientation" = '7' THEN '7'
            WHEN "orientation" = '8' THEN '8'
            WHEN "orientation" = '-90' THEN '6'
            WHEN "orientation" = '90' THEN '8'
            WHEN "orientation" = '180' THEN '3'
            ELSE NULL
            END`);
        await queryRunner.query(`ALTER TABLE "exif" ALTER COLUMN "orientation" TYPE "exif_orientation_enum" USING "orientation"::"exif_orientation_enum"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "exif" ALTER COLUMN "orientation" TYPE character varying USING "orientation"::text`);
        await queryRunner.query(`DROP TYPE "exif_orientation_enum"`);
    }
}
