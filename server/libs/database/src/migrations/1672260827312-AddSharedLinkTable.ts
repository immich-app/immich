import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSharedLinkTable1672260827312 implements MigrationInterface {
    name = 'AddSharedLinkTable1672260827312'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "shared_links" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "description" character varying, "userId" character varying NOT NULL, "key" character varying NOT NULL, "type" character varying NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_642e2b0f619e4876e5f90a43465" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "sharedlink_asset" ("assetsId" uuid NOT NULL, "sharedLinksId" uuid NOT NULL, CONSTRAINT "PK_308679978c1baf69b9c6c710ae6" PRIMARY KEY ("assetsId", "sharedLinksId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_05fedbdca551d427366d8c661a" ON "sharedlink_asset" ("assetsId") `);
        await queryRunner.query(`CREATE INDEX "IDX_503686a97d6974eca5aa588218" ON "sharedlink_asset" ("sharedLinksId") `);
        await queryRunner.query(`CREATE TABLE "sharedlink_album" ("albumsId" uuid NOT NULL, "sharedLinksId" uuid NOT NULL, CONSTRAINT "PK_d0aaa9c7aea2d5177f2ccb1b1e4" PRIMARY KEY ("albumsId", "sharedLinksId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_6010f0d429fb6ed7cadb659b60" ON "sharedlink_album" ("albumsId") `);
        await queryRunner.query(`CREATE INDEX "IDX_0373b25eb6cec4f5a9227d84ce" ON "sharedlink_album" ("sharedLinksId") `);
        await queryRunner.query(`ALTER TABLE "sharedlink_asset" ADD CONSTRAINT "FK_05fedbdca551d427366d8c661a2" FOREIGN KEY ("assetsId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "sharedlink_asset" ADD CONSTRAINT "FK_503686a97d6974eca5aa588218e" FOREIGN KEY ("sharedLinksId") REFERENCES "shared_links"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sharedlink_album" ADD CONSTRAINT "FK_6010f0d429fb6ed7cadb659b60e" FOREIGN KEY ("albumsId") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "sharedlink_album" ADD CONSTRAINT "FK_0373b25eb6cec4f5a9227d84ceb" FOREIGN KEY ("sharedLinksId") REFERENCES "shared_links"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sharedlink_album" DROP CONSTRAINT "FK_0373b25eb6cec4f5a9227d84ceb"`);
        await queryRunner.query(`ALTER TABLE "sharedlink_album" DROP CONSTRAINT "FK_6010f0d429fb6ed7cadb659b60e"`);
        await queryRunner.query(`ALTER TABLE "sharedlink_asset" DROP CONSTRAINT "FK_503686a97d6974eca5aa588218e"`);
        await queryRunner.query(`ALTER TABLE "sharedlink_asset" DROP CONSTRAINT "FK_05fedbdca551d427366d8c661a2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0373b25eb6cec4f5a9227d84ce"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6010f0d429fb6ed7cadb659b60"`);
        await queryRunner.query(`DROP TABLE "sharedlink_album"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_503686a97d6974eca5aa588218"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_05fedbdca551d427366d8c661a"`);
        await queryRunner.query(`DROP TABLE "sharedlink_asset"`);
        await queryRunner.query(`DROP TABLE "shared_links"`);
    }

}
