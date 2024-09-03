import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddApiKeyPermissions1723719333525 implements MigrationInterface {
  name = 'AddApiKeyPermissions1723719333525';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "api_keys" ADD "permissions" character varying array NOT NULL DEFAULT '{all}'`);
    await queryRunner.query(`ALTER TABLE "api_keys" ALTER COLUMN "permissions" DROP DEFAULT`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "api_keys" DROP COLUMN "permissions"`);
  }
}
