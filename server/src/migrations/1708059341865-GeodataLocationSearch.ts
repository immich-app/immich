import { MigrationInterface, QueryRunner } from 'typeorm';

export class GeodataLocationSearch1708059341865 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS unaccent`);

    // https://stackoverflow.com/a/11007216
    await queryRunner.query(`
        CREATE OR REPLACE FUNCTION f_unaccent(text)
            RETURNS text
            LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
        RETURN unaccent('unaccent', $1)`);

    await queryRunner.query(`ALTER TABLE geodata_places ADD COLUMN "admin1Name" varchar`);
    await queryRunner.query(`ALTER TABLE geodata_places ADD COLUMN "admin2Name" varchar`);

    await queryRunner.query(`
        UPDATE geodata_places
        SET "admin1Name" = admin1.name
        FROM geodata_admin1 admin1
        WHERE admin1.key = "admin1Key"`);

    await queryRunner.query(`
        UPDATE geodata_places
        SET "admin2Name" = admin2.name
        FROM geodata_admin2 admin2
        WHERE admin2.key = "admin2Key"`);

    await queryRunner.query(`DROP TABLE geodata_admin1 CASCADE`);
    await queryRunner.query(`DROP TABLE geodata_admin2 CASCADE`);

    await queryRunner.query(`
        ALTER TABLE geodata_places
            DROP COLUMN "admin1Key",
            DROP COLUMN "admin2Key"`);

    await queryRunner.query(`
        CREATE INDEX idx_geodata_places_name
            ON geodata_places
        USING gin (f_unaccent(name) gin_trgm_ops)`);

    await queryRunner.query(`
        CREATE INDEX idx_geodata_places_admin1_name
            ON geodata_places
        USING gin (f_unaccent("admin1Name") gin_trgm_ops)`);

    await queryRunner.query(`
        CREATE INDEX idx_geodata_places_admin2_name
            ON geodata_places
        USING gin (f_unaccent("admin2Name") gin_trgm_ops)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        CREATE TABLE "geodata_admin1" (
            "key" character varying NOT NULL,
            "name" character varying NOT NULL,
            CONSTRAINT "PK_3fe3a89c5aac789d365871cb172" PRIMARY KEY ("key")
        )`);

    await queryRunner.query(`
        CREATE TABLE "geodata_admin2" (
            "key" character varying NOT NULL,
            "name" character varying NOT NULL,
            CONSTRAINT "PK_1e3886455dbb684d6f6b4756726" PRIMARY KEY ("key")
        )`);

    await queryRunner.query(`
        ALTER TABLE geodata_places
            ADD COLUMN "admin1Key" character varying
                GENERATED ALWAYS AS ("countryCode" || '.' || "admin1Code") STORED,
            ADD COLUMN "admin2Key" character varying
                GENERATED ALWAYS AS ("countryCode" || '.' || "admin1Code" || '.' || "admin2Code") STORED`);

    await queryRunner.query(
      `
        INSERT INTO "geodata_admin1"
        SELECT DISTINCT
            "admin1Key" AS "key",
            "admin1Name" AS "name"
        FROM geodata_places
        WHERE "admin1Name" IS NOT NULL`,
    );

    await queryRunner.query(
      `
          INSERT INTO "geodata_admin2"
          SELECT DISTINCT
              "admin2Key" AS "key",
              "admin2Name" AS "name"
          FROM geodata_places
          WHERE "admin2Name" IS NOT NULL`,
    );

    await queryRunner.query(`
            UPDATE geodata_places
            SET "admin1Name" = admin1.name
            FROM geodata_admin1 admin1
            WHERE admin1.key = "admin1Key"`);

    await queryRunner.query(`
            UPDATE geodata_places
            SET "admin2Name" = admin2.name
            FROM geodata_admin2 admin2
            WHERE admin2.key = "admin2Key";`);
  }
}
