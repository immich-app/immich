import { MigrationInterface, QueryRunner } from 'typeorm';

export class AcknowledgeLatestVersion1691252482304 implements MigrationInterface {
  name = 'AcknowledgeLatestVersion1691252482304';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "acknowledgeLatestVersion" boolean NOT NULL DEFAULT false`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "acknowledgeLatestVersion"`);
  }
}
