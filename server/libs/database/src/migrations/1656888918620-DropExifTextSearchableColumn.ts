import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropExifTextSearchableColumns1656888918620 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "exif" DROP COLUMN "exif_text_searchable_column"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE exif 
      DROP COLUMN IF EXISTS exif_text_searchable_column;

      ALTER TABLE exif
      ADD COLUMN IF NOT EXISTS exif_text_searchable_column tsvector
          GENERATED ALWAYS AS (
              TO_TSVECTOR('english',
                         COALESCE(make, '') || ' ' ||
                         COALESCE(model, '') || ' ' ||
                         COALESCE(orientation, '') || ' ' ||
                         COALESCE("lensModel", '') || ' ' ||
                         COALESCE("city", '') || ' ' ||
                         COALESCE("state", '') || ' ' ||
                         COALESCE("country", '')
                  )
              ) STORED;

      CREATE INDEX exif_text_searchable_idx 
        ON exif 
        USING GIN (exif_text_searchable_column);
    `);
  }
}
