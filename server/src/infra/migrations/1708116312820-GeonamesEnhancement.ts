import { MigrationInterface, QueryRunner } from "typeorm";

export class GeonamesEnhancement1708116312820 implements MigrationInterface {
    name = 'GeonamesEnhancement1708116312820'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_geodata_gist_earthcoord"`);
        await queryRunner.query(`CREATE TABLE "geodata_alternate_names" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "geodataId" integer, CONSTRAINT "PK_eaffc7b2e62d9c9716de59d8dfc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "geodata_places" DROP COLUMN "earthCoord"`);
        await queryRunner.query(`DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "database" = $3 AND "schema" = $4 AND "table" = $5`, ["GENERATED_COLUMN","earthCoord","immich","public","geodata_places"]);
        await queryRunner.query(`ALTER TABLE "geodata_places" DROP COLUMN "admin1Key"`);
        await queryRunner.query(`DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "database" = $3 AND "schema" = $4 AND "table" = $5`, ["GENERATED_COLUMN","admin1Key","immich","public","geodata_places"]);
        await queryRunner.query(`ALTER TABLE "geodata_places" DROP COLUMN "admin2Key"`);
        await queryRunner.query(`DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "database" = $3 AND "schema" = $4 AND "table" = $5`, ["GENERATED_COLUMN","admin2Key","immich","public","geodata_places"]);
        await queryRunner.query(`ALTER TABLE "geodata_places" ADD "admin1Name" character varying`);
        await queryRunner.query(`ALTER TABLE "geodata_places" ADD "admin2Name" character varying`);
        await queryRunner.query(`ALTER TABLE "geodata_alternate_names" ADD CONSTRAINT "FK_22220ddddacce7bfc2b92c0ef76" FOREIGN KEY ("geodataId") REFERENCES "geodata_places"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "geodata_alternate_names" DROP CONSTRAINT "FK_22220ddddacce7bfc2b92c0ef76"`);
        await queryRunner.query(`ALTER TABLE "geodata_places" DROP COLUMN "admin2Name"`);
        await queryRunner.query(`ALTER TABLE "geodata_places" DROP COLUMN "admin1Name"`);
        await queryRunner.query(`INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES ($1, $2, $3, $4, $5, $6)`, ["immich","public","geodata_places","GENERATED_COLUMN","admin2Key","\"countryCode\" || '.' || \"admin1Code\" || '.' || \"admin2Code\""]);
        await queryRunner.query(`ALTER TABLE "geodata_places" ADD "admin2Key" character varying GENERATED ALWAYS AS ("countryCode" || '.' || "admin1Code" || '.' || "admin2Code") STORED`);
        await queryRunner.query(`INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES ($1, $2, $3, $4, $5, $6)`, ["immich","public","geodata_places","GENERATED_COLUMN","admin1Key","\"countryCode\" || '.' || \"admin1Code\""]);
        await queryRunner.query(`ALTER TABLE "geodata_places" ADD "admin1Key" character varying GENERATED ALWAYS AS ("countryCode" || '.' || "admin1Code") STORED`);
        await queryRunner.query(`INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES ($1, $2, $3, $4, $5, $6)`, ["immich","public","geodata_places","GENERATED_COLUMN","earthCoord",""]);
        await queryRunner.query(`ALTER TABLE "geodata_places" ADD "earthCoord" cube`);
        await queryRunner.query(`DROP TABLE "geodata_alternate_names"`);
        await queryRunner.query(`CREATE INDEX "IDX_geodata_gist_earthcoord" ON "geodata_places" USING GiST ("earthCoord") `);
    }

}
