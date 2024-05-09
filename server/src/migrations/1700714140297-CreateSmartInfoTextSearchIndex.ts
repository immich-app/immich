import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSmartInfoTextSearchIndex1700714140297 implements MigrationInterface {
  name = 'CreateSmartInfoTextSearchIndex1700714140297';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // https://dba.stackexchange.com/a/164081
    await queryRunner.query(`
        CREATE OR REPLACE FUNCTION f_concat_ws(text, text[])
        RETURNS text
        LANGUAGE sql IMMUTABLE PARALLEL SAFE AS
        'SELECT array_to_string($2, $1)'`);

    await queryRunner.query(`
        ALTER TABLE smart_info ADD "smartInfoTextSearchableColumn" tsvector
        GENERATED ALWAYS AS (
            TO_TSVECTOR(
                'english', 
                f_concat_ws(
                    ' '::text, 
                    COALESCE(tags, array[]::text[]) || COALESCE(objects, array[]::text[])
                )
            )
        )
        STORED NOT NULL`);

    await queryRunner.query(`
        CREATE INDEX smart_info_text_searchable_idx
        ON smart_info
        USING GIN ("smartInfoTextSearchableColumn")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP FUNCTION IF EXISTS immutable_concat_ws`);
    await queryRunner.query(`ALTER TABLE smart_info DROP IF EXISTS "smartInfoTextSearchableColumn"`);
  }
}
