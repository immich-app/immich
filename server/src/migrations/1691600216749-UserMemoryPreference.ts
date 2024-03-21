import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserMemoryPreference1691600216749 implements MigrationInterface {
  name = 'UserMemoryPreference1691600216749';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "memoriesEnabled" boolean NOT NULL DEFAULT true`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "memoriesEnabled"`);
  }
}
