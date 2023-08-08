import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAuditTable1691462205943 implements MigrationInterface {
    name = 'AddAuditTable1691462205943'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "audit" ("id" SERIAL NOT NULL, "entityType" character varying NOT NULL, "entityId" character varying NOT NULL, "action" character varying NOT NULL, "onwerId" character varying NOT NULL, "userId" character varying NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_1d3d120ddaf7bc9b1ed68ed463a" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "audit"`);
    }

}
