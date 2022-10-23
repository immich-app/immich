import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateAssetTableWithNewUniqueConstraint1661971370662 implements MigrationInterface {
  name = 'UpdateAssetTableWithNewUniqueConstraint1661971370662';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "assets" DROP CONSTRAINT "UQ_b599ab0bd9574958acb0b30a90e"`);
    await queryRunner.query(`ALTER TABLE "assets" ADD CONSTRAINT "UQ_userid_checksum" UNIQUE ("userId", "checksum")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "assets" DROP CONSTRAINT "UQ_userid_checksum"`);
    await queryRunner.query(
      `ALTER TABLE "assets" ADD CONSTRAINT "UQ_b599ab0bd9574958acb0b30a90e" UNIQUE ("deviceAssetId", "userId", "deviceId")`,
    );
  }
}
