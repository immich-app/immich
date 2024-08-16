import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAssetUserTable1723804572991 implements MigrationInterface {
    name = 'AddAssetUserTable1723804572991'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // create table, just with the "isFavorite" property for now
        await queryRunner.query(`CREATE TABLE "asset_user" ("userId" uuid NOT NULL, "assetId" uuid NOT NULL, "isFavorite" boolean default false not null, CONSTRAINT "PK_b4b14fe8347d81d374bc5b5f8e7" PRIMARY KEY ("userId", "assetId"))`);
        await queryRunner.query(`ALTER TABLE "asset_user" ADD CONSTRAINT "FK_d9cc706fa73fdbf08b77e73bd79" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "asset_user" ADD CONSTRAINT "FK_b5f17ca35363fb7c1650c7d03f9" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`CREATE INDEX "IDX_b5f17ca35363fb7c1650c7d03f" ON "asset_user" ("assetId") `);

        // fill with "isFavorite" data
        await queryRunner.query(`INSERT INTO "asset_user" ("userId", "assetId", "isFavorite") SELECT "ownerId", "id", "isFavorite" FROM "assets" WHERE "isFavorite"`);

        // remove "isFavorite" column
        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "isFavorite"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // add column
        await queryRunner.query(`ALTER TABLE "assets" ADD COLUMN "isFavorite" boolean default false not null`);

        // fill with data
        await queryRunner.query(`UPDATE "assets" SET "isFavorite" = true WHERE "assets"."id" IN (SELECT "assetId" FROM "asset_user" WHERE "userId" = "assets"."ownerId" AND "asset_user"."isFavorite")`);

        // drop table
        await queryRunner.query(`DROP INDEX "public"."IDX_b5f17ca35363fb7c1650c7d03f"`);
        await queryRunner.query(`ALTER TABLE "asset_user" DROP CONSTRAINT "FK_b5f17ca35363fb7c1650c7d03f9"`);
        await queryRunner.query(`ALTER TABLE "asset_user" DROP CONSTRAINT "FK_d9cc706fa73fdbf08b77e73bd79"`);
        await queryRunner.query(`DROP TABLE "asset_user"`);
    }

}
