import { MigrationInterface, QueryRunner } from 'typeorm';

export class ResetMemories1741027685381 implements MigrationInterface {
  name = 'ResetMemories1741027685381';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "memories"`);
    await queryRunner.query(`DELETE FROM "system_metadata" WHERE "key" = 'memories-state'`);
  }

  public async down(): Promise<void> {
    // nothing to do
  }
}
