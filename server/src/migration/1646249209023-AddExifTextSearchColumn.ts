import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExifTextSearchColumn1646249209023 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE exif
      ADD COLUMN IF NOT EXISTS exif_text_searchable_column tsvector
          GENERATED ALWAYS AS (
              TO_TSVECTOR('english',
                         COALESCE(make, '') || ' ' ||
                         COALESCE(model, '') || ' ' ||
                         COALESCE(orientation, '') || ' ' ||
                         COALESCE("lensModel", '')
                  )
              ) STORED;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE exif 
      DROP COLUMN IF EXISTS exif_text_searchable_column;
    `);
  }
}
