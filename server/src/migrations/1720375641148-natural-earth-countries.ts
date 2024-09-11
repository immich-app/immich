import { MigrationInterface, QueryRunner } from "typeorm";

export class NaturalEarthCountries1720375641148 implements MigrationInterface {
    name = 'NaturalEarthCountries1720375641148'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "naturalearth_countries" ("id" SERIAL NOT NULL, "admin" character varying(50) NOT NULL, "admin_a3" character varying(3) NOT NULL, "type" character varying(50) NOT NULL, "coordinates" polygon NOT NULL, CONSTRAINT "PK_21a6d86d1ab5d841648212e5353" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "naturalearth_countries"`);
    }

}
