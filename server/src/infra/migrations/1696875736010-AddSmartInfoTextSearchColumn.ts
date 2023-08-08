import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSmartInfoTextSearchColumn1696875736010 implements MigrationInterface {
  name = 'AddSmartInfoTextSearchColumn1696875736010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        CREATE OR REPLACE FUNCTION immutable_concat_ws(text, text[])
        RETURNS text
        LANGUAGE internal IMMUTABLE PARALLEL SAFE AS
        'text_concat_ws'`);
    await queryRunner.query(`
        ALTER TABLE "smart_info" ADD "smartInfoTextSearchableColumn" tsvector
        GENERATED ALWAYS AS (
            TO_TSVECTOR(
                'english', 
                immutable_concat_ws(
                    ' '::text, 
                    COALESCE(tags, array[]::text[]) || COALESCE(objects, array[]::text[])
                )
            )
        )
        STORED NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP FUNCTION IF EXISTS immutable_concat_ws(text, text[])`);
    await queryRunner.query(`ALTER TABLE "smart_info" DROP COLUMN IF EXISTS "smartInfoTextSearchableColumn"`);
  }
}
