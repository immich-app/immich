import { MigrationInterface, QueryRunner } from 'typeorm';

export class UnsetStackedAssetsFromDuplicateStatus1740654480319 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            update assets
            set "duplicateId" = null
            where "stackId" is not null`);
  }

  public async down(): Promise<void> {
    // No need to revert this migration
  }
}
