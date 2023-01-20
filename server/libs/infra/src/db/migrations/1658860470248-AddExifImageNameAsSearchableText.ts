import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExifImageNameAsSearchableText1658860470248 implements MigrationInterface {
  name = 'AddExifImageNameAsSearchableText1658860470248';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "exif" DROP COLUMN "exifTextSearchableColumn"`);
    await queryRunner.query(
      `DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "database" = $3 AND "schema" = $4 AND "table" = $5`,
      ['GENERATED_COLUMN', 'exifTextSearchableColumn', 'immich', 'public', 'exif'],
    );
    await queryRunner.query(`ALTER TABLE "exif" ADD "exifTextSearchableColumn" tsvector GENERATED ALWAYS AS (TO_TSVECTOR('english',
                         COALESCE(make, '') || ' ' ||
                         COALESCE(model, '') || ' ' ||
                         COALESCE(orientation, '') || ' ' ||
                         COALESCE("lensModel", '') || ' ' ||
                         COALESCE("imageName", '') || ' ' ||
                         COALESCE("city", '') || ' ' ||
                         COALESCE("state", '') || ' ' ||
                         COALESCE("country", ''))) STORED`);
    await queryRunner.query(
      `DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "database" = $3 AND "schema" = $4 AND "table" = $5`,
      ['GENERATED_COLUMN', 'exifTextSearchableColumn', 'immich', 'public', 'exif'],
    );
    await queryRunner.query(
      `INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        'immich',
        'public',
        'exif',
        'GENERATED_COLUMN',
        'exifTextSearchableColumn',
        "TO_TSVECTOR('english',\n                         COALESCE(make, '') || ' ' ||\n                         COALESCE(model, '') || ' ' ||\n                         COALESCE(orientation, '') || ' ' ||\n                         COALESCE(\"lensModel\", '') || ' ' ||\n                         COALESCE(\"imageName\", '') || ' ' ||\n                         COALESCE(\"city\", '') || ' ' ||\n                         COALESCE(\"state\", '') || ' ' ||\n                         COALESCE(\"country\", ''))",
      ],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "database" = $3 AND "schema" = $4 AND "table" = $5`,
      ['GENERATED_COLUMN', 'exifTextSearchableColumn', 'immich', 'public', 'exif'],
    );
    await queryRunner.query(`ALTER TABLE "exif" DROP COLUMN "exifTextSearchableColumn"`);
    await queryRunner.query(
      `INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES ($1, $2, $3, $4, $5, $6)`,
      ['immich', 'public', 'exif', 'GENERATED_COLUMN', 'exifTextSearchableColumn', ''],
    );
    await queryRunner.query(`ALTER TABLE "exif" ADD "exifTextSearchableColumn" tsvector NOT NULL`);
  }
}
