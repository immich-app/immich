import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTimeBucketIndices1734574016301 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX idx_local_date_time_month ON assets ((date_trunc('MONTH', "localDateTime" at time zone 'UTC') at time zone 'UTC'))`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_local_date_time ON assets ((("localDateTime" at time zone 'UTC')::date))`,
    );
    await queryRunner.query(`DROP INDEX "IDX_day_of_month"`);
    await queryRunner.query(`DROP INDEX "IDX_month"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX idx_local_date_time_month`);
    await queryRunner.query(`DROP INDEX idx_local_date_time`);
    await queryRunner.query(
      `CREATE INDEX "IDX_day_of_month" ON assets (EXTRACT(DAY FROM "localDateTime" AT TIME ZONE 'UTC'))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_month" ON assets (EXTRACT(MONTH FROM "localDateTime" AT TIME ZONE 'UTC'))`,
    );
  }
}
