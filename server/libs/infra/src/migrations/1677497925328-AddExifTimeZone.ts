import { MigrationInterface, QueryRunner } from "typeorm";

export class AddExifTimeZone1677497925328 implements MigrationInterface {
    name = 'AddExifTimeZone1677497925328'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "exif" ADD "timeZone" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "exif" DROP COLUMN "timeZone"`);
    }

}
