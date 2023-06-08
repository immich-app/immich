import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixTimestampDataTypeInAssetTable1662427365521 implements MigrationInterface {
  name = 'FixTimestampDataTypeInAssetTable1662427365521';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "exif" ALTER COLUMN "exifTextSearchableColumn" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "assets" ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt"::timestamptz`,
    );
    await queryRunner.query(
      `ALTER TABLE "assets" ALTER COLUMN "modifiedAt" TYPE timestamptz USING "createdAt"::timestamptz`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "assets" ALTER COLUMN "createdAt" TYPE varchar USING "createdAt"::varchar`);
    await queryRunner.query(`ALTER TABLE "assets" ALTER COLUMN "modifiedAt" TYPE varchar USING "createdAt"::varchar`);
    await queryRunner.query(`ALTER TABLE "exif" ALTER COLUMN "exifTextSearchableColumn" DROP NOT NULL`);
  }
}
