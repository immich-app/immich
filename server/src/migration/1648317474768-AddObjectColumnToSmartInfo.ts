import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddObjectColumnToSmartInfo1648317474768 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE smart_info
        ADD COLUMN if not exists objects text[];

    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE smart_info
        DROP COLUMN objects;
    `);
  }
}
