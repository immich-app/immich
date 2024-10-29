import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRating1722753178937 implements MigrationInterface {
    name = 'AddRating1722753178937'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "exif" ADD "rating" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "exif" DROP COLUMN "rating"`);
    }

}
