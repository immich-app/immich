import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCLIPEncodeDataColumn1677971458822 implements MigrationInterface {
  name = 'AddCLIPEncodeDataColumn1677971458822';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "smart_info" ADD "clipEmbedding" numeric(20,19) array`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "smart_info" DROP COLUMN "clipEmbedding"`);
  }
}
