import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveImageNameFromEXIFTable1681159594469 implements MigrationInterface {
  name = 'RemoveImageNameFromEXIFTable1681159594469';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "exif" DROP COLUMN IF EXISTS "exifTextSearchableColumn"`);
    await queryRunner.query(`ALTER TABLE "exif" ADD "exifTextSearchableColumn" tsvector GENERATED ALWAYS AS (TO_TSVECTOR('english',
                     COALESCE(make, '') || ' ' ||
                     COALESCE(model, '') || ' ' ||
                     COALESCE(orientation, '') || ' ' ||
                     COALESCE("lensModel", '') || ' ' ||
                     COALESCE("city", '') || ' ' ||
                     COALESCE("state", '') || ' ' ||
                     COALESCE("country", ''))) STORED NOT NULL`);
    await queryRunner.query(`ALTER TABLE "exif" DROP COLUMN "imageName"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "exif" DROP COLUMN "exifTextSearchableColumn"`);
    await queryRunner.query(`ALTER TABLE "exif" ADD "exifTextSearchableColumn" tsvector GENERATED ALWAYS AS (TO_TSVECTOR('english',
                         COALESCE(make, '') || ' ' ||
                         COALESCE(model, '') || ' ' ||
                         COALESCE(orientation, '') || ' ' ||
                         COALESCE("lensModel", '') || ' ' ||
                         COALESCE("imageName", '') || ' ' ||
                         COALESCE("city", '') || ' ' ||
                         COALESCE("state", '') || ' ' ||
                         COALESCE("country", ''))) STORED NOT NULL`);
    await queryRunner.query(`ALTER TABLE "exif" ADD "imageName" character varying`);
  }
}
