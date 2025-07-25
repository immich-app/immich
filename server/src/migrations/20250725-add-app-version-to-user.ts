import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAppVersionToUser20250725 implements MigrationInterface {
  name = 'AddAppVersionToUser20250725';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN "appVersion" character varying NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "appVersion"`);
  }
}
