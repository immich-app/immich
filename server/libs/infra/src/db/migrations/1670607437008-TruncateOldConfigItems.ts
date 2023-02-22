import { MigrationInterface, QueryRunner } from 'typeorm';

export class TruncateOldConfigItems1670607437008 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`TRUNCATE TABLE "system_config"`);
  }

  public async down(): Promise<void> {
    // noop
  }
}
