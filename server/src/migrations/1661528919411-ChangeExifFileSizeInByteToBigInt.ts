import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeExifFileSizeInByteToBigInt1661528919411 implements MigrationInterface {
  name = 'ChangeExifFileSizeInByteToBigInt1661528919411';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE exif
      ALTER COLUMN "fileSizeInByte" type bigint using "fileSizeInByte"::bigint;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
    ALTER TABLE exif
    ALTER COLUMN "fileSizeInByte" type integer using "fileSizeInByte"::integer;
  `);
  }
}
