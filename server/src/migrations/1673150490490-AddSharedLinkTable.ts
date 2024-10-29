import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSharedLinkTable1673150490490 implements MigrationInterface {
    name = 'AddSharedLinkTable1673150490490'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "shared_links" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "description" character varying, "userId" character varying NOT NULL, "key" bytea NOT NULL, "type" character varying NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE, "allowUpload" boolean NOT NULL DEFAULT false, "albumId" uuid, CONSTRAINT "UQ_sharedlink_key" UNIQUE ("key"), CONSTRAINT "PK_642e2b0f619e4876e5f90a43465" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_sharedlink_key" ON "shared_links" ("key") `);
        await queryRunner.query(`CREATE TABLE "shared_link__asset" ("assetsId" uuid NOT NULL, "sharedLinksId" uuid NOT NULL, CONSTRAINT "PK_9b4f3687f9b31d1e311336b05e3" PRIMARY KEY ("assetsId", "sharedLinksId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5b7decce6c8d3db9593d6111a6" ON "shared_link__asset" ("assetsId") `);
        await queryRunner.query(`CREATE INDEX "IDX_c9fab4aa97ffd1b034f3d6581a" ON "shared_link__asset" ("sharedLinksId") `);
        await queryRunner.query(`ALTER TABLE "shared_links" ADD CONSTRAINT "FK_0c6ce9058c29f07cdf7014eac66" FOREIGN KEY ("albumId") REFERENCES "albums"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "shared_link__asset" ADD CONSTRAINT "FK_5b7decce6c8d3db9593d6111a66" FOREIGN KEY ("assetsId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "shared_link__asset" ADD CONSTRAINT "FK_c9fab4aa97ffd1b034f3d6581ab" FOREIGN KEY ("sharedLinksId") REFERENCES "shared_links"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "shared_link__asset" DROP CONSTRAINT "FK_c9fab4aa97ffd1b034f3d6581ab"`);
        await queryRunner.query(`ALTER TABLE "shared_link__asset" DROP CONSTRAINT "FK_5b7decce6c8d3db9593d6111a66"`);
        await queryRunner.query(`ALTER TABLE "shared_links" DROP CONSTRAINT "FK_0c6ce9058c29f07cdf7014eac66"`);
        await queryRunner.query(`DROP INDEX "IDX_c9fab4aa97ffd1b034f3d6581a"`);
        await queryRunner.query(`DROP INDEX "IDX_5b7decce6c8d3db9593d6111a6"`);
        await queryRunner.query(`DROP TABLE "shared_link__asset"`);
        await queryRunner.query(`DROP INDEX "IDX_sharedlink_key"`);
        await queryRunner.query(`DROP TABLE "shared_links"`);
    }

}
