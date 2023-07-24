import { MigrationInterface, QueryRunner } from 'typeorm';

export class Panoramas1690140002097 implements MigrationInterface {
  name = 'Panoramas1690140002097';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "assets" ADD "projectionType" character varying NOT NULL`);
    await queryRunner.query(`ALTER TABLE "exif" ADD "projectionType" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "projectionType"`);
    await queryRunner.query(`ALTER TABLE "exif" DROP COLUMN "projectionType"`);
  }
}
