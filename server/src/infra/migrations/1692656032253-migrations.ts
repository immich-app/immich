import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1692656032253 implements MigrationInterface {
    name = 'Migrations1692656032253'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "audit" ("id" SERIAL NOT NULL, "entityType" character varying NOT NULL, "entityId" uuid NOT NULL, "action" character varying NOT NULL, "ownerId" uuid NOT NULL, "time" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_1d3d120ddaf7bc9b1ed68ed463a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_ownerId_time" ON "audit" ("ownerId", "time") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_ownerId_time"`);
        await queryRunner.query(`DROP TABLE "audit"`);
    }

}
