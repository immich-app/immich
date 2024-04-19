import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameSessionsTable1713490844785 implements MigrationInterface {
  name = 'RenameSessionsTable1713490844785';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_token" RENAME TO "sessions"`);
    await queryRunner.query(`ALTER TABLE "sessions" RENAME CONSTRAINT "FK_d37db50eecdf9b8ce4eedd2f918" to "FK_57de40bc620f456c7311aa3a1e6"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sessions" RENAME CONSTRAINT "FK_57de40bc620f456c7311aa3a1e6" to "FK_d37db50eecdf9b8ce4eedd2f918"`);
    await queryRunner.query(`ALTER TABLE "sessions" RENAME TO "user_token"`);
  }
}
