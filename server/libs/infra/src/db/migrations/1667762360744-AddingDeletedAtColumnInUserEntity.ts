import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddingDeletedAtColumnInUserEntity1667762360744 implements MigrationInterface {
  name = 'AddingDeletedAtColumnInUserEntity1667762360744';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "deletedAt" TIMESTAMP`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deletedAt"`);
  }
}
