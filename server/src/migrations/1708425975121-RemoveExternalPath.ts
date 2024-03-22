import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveExternalPath1708425975121 implements MigrationInterface {
  name = 'RemoveExternalPath1708425975121';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "externalPath"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "externalPath" character varying`);
  }
}
