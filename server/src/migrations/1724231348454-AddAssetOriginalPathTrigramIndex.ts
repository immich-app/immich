import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAssetOriginalPathTrigramIndex1724231348454 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`CREATE INDEX idx_originalPath_trigram ON assets USING gin (f_unaccent("originalPath") gin_trgm_ops)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`DROP INDEX "idx_originalPath_trigram"`);
    }

}
