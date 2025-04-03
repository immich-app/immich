import { MigrationInterface, QueryRunner } from 'typeorm';

export class GeodataCleanup1743611339000 implements MigrationInterface {
  name = 'GeodataCleanup1743611339000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER INDEX IF EXISTS "idx_geodata_places_admin2_alternate_names" RENAME TO "idx_geodata_places_alternate_names"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "geodata_places_tmp"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "naturalearth_countries_tmp"`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER INDEX IF EXISTS "idx_geodata_places_alternate_names" RENAME TO "idx_geodata_places_admin2_alternate_names"`,
    );
  }
}
