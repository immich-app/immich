import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExifImageNameAsSearchableText1658860470248 implements MigrationInterface {
  name = 'AddExifImageNameAsSearchableText1658860470248';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "exif" DROP COLUMN "exifTextSearchableColumn"`);
    await queryRunner.query(`ALTER TABLE "exif" ADD "exifTextSearchableColumn" tsvector GENERATED ALWAYS AS (TO_TSVECTOR('english',
                         COALESCE(make, '') || ' ' ||
                         COALESCE(model, '') || ' ' ||
                         COALESCE(orientation, '') || ' ' ||
                         COALESCE("lensModel", '') || ' ' ||
                         COALESCE("imageName", '') || ' ' ||
                         COALESCE("city", '') || ' ' ||
                         COALESCE("state", '') || ' ' ||
                         COALESCE("country", ''))) STORED`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "exif" ADD "exifTextSearchableColumn" tsvector NOT NULL`);
  }
}
