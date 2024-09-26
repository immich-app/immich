import { MigrationInterface, QueryRunner } from "typeorm";

export class AddExifCityIndex1701665867595 implements MigrationInterface {
    name = 'AddExifCityIndex1701665867595'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "exif_city" ON "exif" ("city") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "exif_city"`);
    }

}
