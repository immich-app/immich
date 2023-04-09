import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAssetAlbumJoinTable1681008935063 implements MigrationInterface {
    name = 'CreateAssetAlbumJoinTable1681008935063'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "assets_albums_albums" ("assetsId" uuid NOT NULL, "albumsId" uuid NOT NULL, CONSTRAINT "PK_558fb2b7f2c75c11d1170988e97" PRIMARY KEY ("assetsId", "albumsId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_3e474191487d3335049a76815e" ON "assets_albums_albums" ("assetsId") `);
        await queryRunner.query(`CREATE INDEX "IDX_e6ef86e3e4e4e2d0e85b72c20c" ON "assets_albums_albums" ("albumsId") `);
        await queryRunner.query(`ALTER TABLE "assets_albums_albums" ADD CONSTRAINT "FK_3e474191487d3335049a76815ef" FOREIGN KEY ("assetsId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "assets_albums_albums" ADD CONSTRAINT "FK_e6ef86e3e4e4e2d0e85b72c20ca" FOREIGN KEY ("albumsId") REFERENCES "albums"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assets_albums_albums" DROP CONSTRAINT "FK_e6ef86e3e4e4e2d0e85b72c20ca"`);
        await queryRunner.query(`ALTER TABLE "assets_albums_albums" DROP CONSTRAINT "FK_3e474191487d3335049a76815ef"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e6ef86e3e4e4e2d0e85b72c20c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3e474191487d3335049a76815e"`);
        await queryRunner.query(`DROP TABLE "assets_albums_albums"`);
    }

}
