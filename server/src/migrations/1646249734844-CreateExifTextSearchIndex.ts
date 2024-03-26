import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateExifTextSearchIndex1646249734844 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        CREATE INDEX exif_text_searchable_idx 
        ON exif 
        USING GIN (exif_text_searchable_column);
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS exif_text_searchable_idx ON exif;
      `);
  }
}
