import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVersionHistory1727797340951 implements MigrationInterface {
    name = 'AddVersionHistory1727797340951'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "version_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "version" character varying NOT NULL, CONSTRAINT "PK_5db259cbb09ce82c0d13cfd1b23" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "version_history"`);
    }

}
