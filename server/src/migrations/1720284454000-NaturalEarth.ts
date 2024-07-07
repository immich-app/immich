import { MigrationInterface, QueryRunner } from "typeorm";

export class NaturalEarth1720284454002 implements MigrationInterface {
    name = 'NaturalEarth1720284454002'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "naturalearth_countries" ("admin" character varying(50) NOT NULL, "admin_a3" character varying(3) NOT NULL, "type" character varying(50) NOT NULL, "coordinates" polygon)`);
        await queryRunner.query(`ALTER TABLE naturalearth_countries ADD COLUMN id SERIAL PRIMARY KEY`);

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE naturalearth_countries`);
    }

}
