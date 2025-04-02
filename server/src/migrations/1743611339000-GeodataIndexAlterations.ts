import { MigrationInterface, QueryRunner } from 'typeorm';

export class GeodataIndexAlterations1743611339000 implements MigrationInterface {
  name = 'GeodataIndexAlterations1743611339000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER INDEX IF EXISTS "idx_geodata_places_admin2_alternate_names" RENAME TO "idx_geodata_places_alternate_names"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
  }
}
