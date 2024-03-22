import { MigrationInterface, QueryRunner } from 'typeorm';

export class Panoramas1690217088596 implements MigrationInterface {
  name = 'Panoramas1690217088596';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "exif" ADD "projectionType" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "exif" DROP COLUMN "projectionType"`);
  }
}
