import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMemoryTable1711637874206 implements MigrationInterface {
    name = 'AddMemoryTable1711637874206'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "memories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "ownerId" uuid NOT NULL, "type" character varying NOT NULL, "data" jsonb NOT NULL, "isSaved" boolean NOT NULL DEFAULT false, "memoryAt" TIMESTAMP WITH TIME ZONE NOT NULL, "seenAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_aaa0692d9496fe827b0568612f8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "memories_assets_assets" ("memoriesId" uuid NOT NULL, "assetsId" uuid NOT NULL, CONSTRAINT "PK_fcaf7112a013d1703c011c6793d" PRIMARY KEY ("memoriesId", "assetsId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_984e5c9ab1f04d34538cd32334" ON "memories_assets_assets" ("memoriesId") `);
        await queryRunner.query(`CREATE INDEX "IDX_6942ecf52d75d4273de19d2c16" ON "memories_assets_assets" ("assetsId") `);
        await queryRunner.query(`ALTER TABLE "memories" ADD CONSTRAINT "FK_575842846f0c28fa5da46c99b19" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "memories_assets_assets" ADD CONSTRAINT "FK_984e5c9ab1f04d34538cd32334e" FOREIGN KEY ("memoriesId") REFERENCES "memories"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "memories_assets_assets" ADD CONSTRAINT "FK_6942ecf52d75d4273de19d2c16f" FOREIGN KEY ("assetsId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "memories_assets_assets" DROP CONSTRAINT "FK_6942ecf52d75d4273de19d2c16f"`);
        await queryRunner.query(`ALTER TABLE "memories_assets_assets" DROP CONSTRAINT "FK_984e5c9ab1f04d34538cd32334e"`);
        await queryRunner.query(`ALTER TABLE "memories" DROP CONSTRAINT "FK_575842846f0c28fa5da46c99b19"`);
        await queryRunner.query(`DROP INDEX "IDX_6942ecf52d75d4273de19d2c16"`);
        await queryRunner.query(`DROP INDEX "IDX_984e5c9ab1f04d34538cd32334"`);
        await queryRunner.query(`DROP TABLE "memories_assets_assets"`);
        await queryRunner.query(`DROP TABLE "memories"`);
    }

}
