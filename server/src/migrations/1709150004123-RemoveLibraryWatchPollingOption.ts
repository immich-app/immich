import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveLibraryWatchPollingOption1709150004123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "system_config" WHERE key = 'library.watch.usePolling'`);
    await queryRunner.query(`DELETE FROM "system_config" WHERE key = 'library.watch.interval'`);
  }

  public async down(): Promise<void> {
    // noop
  }
}
