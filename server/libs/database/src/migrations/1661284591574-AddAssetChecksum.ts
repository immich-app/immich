import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAssetChecksum1661284591574 implements MigrationInterface {
    name = 'AddAssetChecksum1661284591574'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "exif" ADD "pixelChecksum" character(40)`);
        await queryRunner.query(`ALTER TABLE "assets" ADD "checksum" character(40)`);
        // await queryRunner.query(`ALTER TABLE "exif" ALTER COLUMN "exifTextSearchableColumn" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // await queryRunner.query(`ALTER TABLE "exif" ALTER COLUMN "exifTextSearchableColumn" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "checksum"`);
        await queryRunner.query(`ALTER TABLE "exif" DROP COLUMN "pixelChecksum"`);
    }

}
