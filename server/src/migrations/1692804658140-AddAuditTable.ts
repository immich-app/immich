import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAuditTable1692804658140 implements MigrationInterface {
    name = 'AddAuditTable1692804658140'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "audit" ("id" SERIAL NOT NULL, "entityType" character varying NOT NULL, "entityId" uuid NOT NULL, "action" character varying NOT NULL, "ownerId" uuid NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_1d3d120ddaf7bc9b1ed68ed463a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_ownerId_createdAt" ON "audit" ("ownerId", "createdAt") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_ownerId_createdAt"`);
        await queryRunner.query(`DROP TABLE "audit"`);
    }

}
