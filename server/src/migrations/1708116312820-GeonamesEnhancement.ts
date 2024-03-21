import { MigrationInterface, QueryRunner } from "typeorm";

export class GeonamesEnhancement1708116312820 implements MigrationInterface {
    name = 'GeonamesEnhancement1708116312820'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE geodata_places ADD COLUMN "alternateNames" varchar`);
        await queryRunner.query(`
        CREATE INDEX idx_geodata_places_admin2_alternate_names
            ON geodata_places
        USING gin (f_unaccent("alternateNames") gin_trgm_ops)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE geodata_places DROP COLUMN "alternateNames"`);
    }

}
