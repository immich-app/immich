import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSmartInfoTextSearchIndex1696876192604 implements MigrationInterface {
  name = 'CreateSmartInfoTextSearchIndex1696876192604';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        CREATE INDEX smart_info_text_searchable_idx
        ON smart_info
        USING GIN ("smartInfoTextSearchableColumn")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS smart_info_text_searchable_idx ON smart_info`);
  }
}
