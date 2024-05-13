import { MigrationInterface, QueryRunner } from "typeorm";

export class Geodata1700362016675 implements MigrationInterface {
    name = 'Geodata1700362016675'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS cube`)
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS earthdistance`)
        await queryRunner.query(`CREATE TABLE "geodata_admin2" ("key" character varying NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_1e3886455dbb684d6f6b4756726" PRIMARY KEY ("key"))`);
        await queryRunner.query(`CREATE TABLE "geodata_admin1" ("key" character varying NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_3fe3a89c5aac789d365871cb172" PRIMARY KEY ("key"))`);
        await queryRunner.query(`CREATE TABLE "geodata_places" ("id" integer NOT NULL, "name" character varying(200) NOT NULL, "longitude" double precision NOT NULL, "latitude" double precision NOT NULL, "countryCode" character(2) NOT NULL, "admin1Code" character varying(20), "admin2Code" character varying(80), "admin1Key" character varying GENERATED ALWAYS AS ("countryCode" || '.' || "admin1Code") STORED, "admin2Key" character varying GENERATED ALWAYS AS ("countryCode" || '.' || "admin1Code" || '.' || "admin2Code") STORED, "modificationDate" date NOT NULL, CONSTRAINT "PK_c29918988912ef4036f3d7fbff4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "geodata_places" ADD "earthCoord" earth GENERATED ALWAYS AS (ll_to_earth(latitude, longitude)) STORED`)
        await queryRunner.query(`CREATE INDEX "IDX_geodata_gist_earthcoord" ON "geodata_places" USING gist ("earthCoord");`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_geodata_gist_earthcoord"`);
        await queryRunner.query(`DROP TABLE "geodata_places"`);
        await queryRunner.query(`DROP TABLE "geodata_admin1"`);
        await queryRunner.query(`DROP TABLE "geodata_admin2"`);
        await queryRunner.query(`DROP EXTENSION cube`);
        await queryRunner.query(`DROP EXTENSION earthdistance`);
    }

}
