import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropSmartInfoTable1730989238718 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE smart_info`);
  }

  public async down(): Promise<void> {
    // not implemented
  }
}
