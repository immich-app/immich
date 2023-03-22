import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveDeviceIds1679482851521 implements MigrationInterface {
  name = 'RemoveDeviceIds1679482851521';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "deviceAssetId"`);
    await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "deviceId"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "assets" ADD "deviceId" character varying NOT NULL`);
    await queryRunner.query(`ALTER TABLE "assets" ADD "deviceAssetId" character varying NOT NULL`);
  }
}
