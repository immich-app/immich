import { MigrationInterface, QueryRunner } from "typeorm";

export class SystemMetadata1700345818045 implements MigrationInterface {
    name = 'SystemMetadata1700345818045'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "system_metadata" ("key" character varying NOT NULL, "value" jsonb NOT NULL DEFAULT '{}', CONSTRAINT "PK_fa94f6857470fb5b81ec6084465" PRIMARY KEY ("key"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "system_metadata"`);
    }

}
