import { MigrationInterface, QueryRunner } from "typeorm";

export class Panoramas1690217088596 implements MigrationInterface {
    name = 'Panoramas1690217088596'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."projectionType" AS ENUM('EQUIRECTANGULAR', 'CUBEMAP', 'CUBESTRIP', 'EQUIRECTANGULAR_STEREO', 'CUBEMAP_STEREO', 'CUBESTRIP_STEREO', 'CYLINDER', 'NONE')`);
        await queryRunner.query(`ALTER TABLE "exif" ADD "projectionType" "public"."projectionType" DEFAULT 'NONE'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "exif" DROP COLUMN "projectionType"`);
        await queryRunner.query(`DROP TYPE "public"."projectionType"`);
    }

}
