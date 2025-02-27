import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOAuthStateTable1740146939094 implements MigrationInterface {
    name = 'AddOAuthStateTable1740146939094'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "oauth_state" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "state" character varying NOT NULL, CONSTRAINT "PK_221ed9aa6fdfd98bb5817297b97" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "oauth_state"`);
    }

}
