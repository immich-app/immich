import { MigrationInterface, QueryRunner } from 'typeorm';

export class test1679572446996 implements MigrationInterface {
  name = 'test1679572446996';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "assets" ADD "deviceAssetId" character varying NOT NULL`);
    await queryRunner.query(`ALTER TABLE "assets" ADD "deviceId" character varying NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "deviceId"`);
    await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "deviceAssetId"`);
  }
}
