import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTruncatedDate1713654632360 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE assets
            ADD COLUMN "truncatedDate" timestamptz
                GENERATED ALWAYS AS (date_trunc('day', "localDateTime" at time zone 'UTC') at time zone 'UTC') STORED`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE assets DROP COLUMN "truncatedDate"`);
  }
}
