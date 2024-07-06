import { MigrationInterface, QueryRunner } from "typeorm";

export class NaturalEarth1720284454001 implements MigrationInterface {
    name = 'NaturalEarth1720284454001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "ne_10m_admin_0_countries_test" ("admin" character varying(200) NOT NULL, "admin_a3" character varying(20) NOT NULL, "type" character varying(200) NOT NULL, "coordinates" polygon)`);

        await queryRunner.query(`ALTER TABLE ne_10m_admin_0_countries_test ADD COLUMN id SERIAL PRIMARY KEY`);

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE ne_10m_admin_0_countries_test`);
    }

}
