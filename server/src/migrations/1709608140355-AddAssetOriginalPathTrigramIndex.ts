import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAssetOriginalPathTrigramIndex1709608140355 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
    CREATE INDEX idx_originalFileName_trigram
        ON assets
    USING gin (f_unaccent("originalFileName") gin_trgm_ops)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_originalFileName_trigram"`);
  }
}
