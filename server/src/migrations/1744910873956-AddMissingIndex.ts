import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingIndex1744910873956 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_geodata_gist_earthcoord" ON "geodata_places" (ll_to_earth_public(latitude, longitude))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_geodata_gist_earthcoord";`);
  }
}
