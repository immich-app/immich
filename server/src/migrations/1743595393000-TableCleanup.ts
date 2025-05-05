import { MigrationInterface, QueryRunner } from 'typeorm';

export class TableCleanup1743595393000 implements MigrationInterface {
  name = 'TableCleanup1743595393000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "system_config"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "socket_io_attachments"`);
  }

  public async down(): Promise<void> {}
}
