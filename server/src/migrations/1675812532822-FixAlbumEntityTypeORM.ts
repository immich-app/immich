import { MigrationInterface, QueryRunner } from "typeorm";

export class FixAlbumEntityTypeORM1675812532822 implements MigrationInterface {
    name = 'FixAlbumEntityTypeORM1675812532822'

    public async up(queryRunner: QueryRunner): Promise<void> {

        await queryRunner.query(`ALTER TABLE "asset_album" RENAME TO "albums_assets_assets"`);
        await queryRunner.query(`ALTER TABLE "albums_assets_assets" DROP CONSTRAINT "FK_7ae4e03729895bf87e056d7b598"`);
        await queryRunner.query(`ALTER TABLE "albums_assets_assets" DROP CONSTRAINT "FK_256a30a03a4a0aff0394051397d"`);
        await queryRunner.query(`ALTER TABLE "albums_assets_assets" DROP CONSTRAINT "UQ_unique_asset_in_album"`);
        await queryRunner.query(`ALTER TABLE "albums_assets_assets" DROP CONSTRAINT "PK_a34e076afbc601d81938e2c2277"`);
        await queryRunner.query(`ALTER TABLE "albums_assets_assets" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "albums_assets_assets" RENAME COLUMN "albumId" TO "albumsId"`);
        await queryRunner.query(`ALTER TABLE "albums_assets_assets" RENAME COLUMN "assetId" TO "assetsId"`);
        await queryRunner.query(`ALTER TABLE "albums_assets_assets" ADD CONSTRAINT "PK_c67bc36fa845fb7b18e0e398180" PRIMARY KEY ("albumsId", "assetsId")`);
        await queryRunner.query(`CREATE INDEX "IDX_e590fa396c6898fcd4a50e4092" ON "albums_assets_assets" ("albumsId") `);
        await queryRunner.query(`CREATE INDEX "IDX_4bd1303d199f4e72ccdf998c62" ON "albums_assets_assets" ("assetsId") `);
        await queryRunner.query(`ALTER TABLE "albums_assets_assets" ADD CONSTRAINT "FK_e590fa396c6898fcd4a50e40927" FOREIGN KEY ("albumsId") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "albums_assets_assets" ADD CONSTRAINT "FK_4bd1303d199f4e72ccdf998c621" FOREIGN KEY ("assetsId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE`);

        await queryRunner.query(`ALTER TABLE "user_shared_album" RENAME TO "albums_shared_users_users"`);
        await queryRunner.query(`ALTER TABLE "albums_shared_users_users" DROP CONSTRAINT "FK_543c31211653e63e080ba882eb5"`);
        await queryRunner.query(`ALTER TABLE "albums_shared_users_users" DROP CONSTRAINT "FK_7b3bf0f5f8da59af30519c25f18"`);
        await queryRunner.query(`ALTER TABLE "albums_shared_users_users" DROP CONSTRAINT "PK_unique_user_in_album"`);
        await queryRunner.query(`ALTER TABLE "albums_shared_users_users" DROP CONSTRAINT "PK_b6562316a98845a7b3e9a25cdd0"`);
        await queryRunner.query(`ALTER TABLE "albums_shared_users_users" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "albums_shared_users_users" RENAME COLUMN "albumId" TO "albumsId"`);
        await queryRunner.query(`ALTER TABLE "albums_shared_users_users" RENAME COLUMN "sharedUserId" TO "usersId"`);
        await queryRunner.query(`ALTER TABLE "albums_shared_users_users" ADD CONSTRAINT "PK_7df55657e0b2e8b626330a0ebc8" PRIMARY KEY ("albumsId", "usersId")`);
        await queryRunner.query(`CREATE INDEX "IDX_427c350ad49bd3935a50baab73" ON "albums_shared_users_users" ("albumsId") `);
        await queryRunner.query(`CREATE INDEX "IDX_f48513bf9bccefd6ff3ad30bd0" ON "albums_shared_users_users" ("usersId") `);
        await queryRunner.query(`ALTER TABLE "albums_shared_users_users" ADD CONSTRAINT "FK_427c350ad49bd3935a50baab737" FOREIGN KEY ("albumsId") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "albums_shared_users_users" ADD CONSTRAINT "FK_f48513bf9bccefd6ff3ad30bd06" FOREIGN KEY ("usersId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);

        await queryRunner.query(`ALTER TABLE "albums" DROP CONSTRAINT "FK_b22c53f35ef20c28c21637c85f4"`)
        await queryRunner.query(`ALTER TABLE "albums" ADD CONSTRAINT "FK_b22c53f35ef20c28c21637c85f4" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "albums_assets_assets" RENAME TO "asset_album"`);
        await queryRunner.query(`ALTER TABLE "albums_shared_users_users" RENAME TO "user_shared_album"`);
        await queryRunner.query(`ALTER TABLE "asset_album" DROP CONSTRAINT "FK_e590fa396c6898fcd4a50e40927"`);
        await queryRunner.query(`ALTER TABLE "asset_album" DROP CONSTRAINT "FK_4bd1303d199f4e72ccdf998c621"`);
        await queryRunner.query(`ALTER TABLE "user_shared_album" DROP CONSTRAINT "FK_427c350ad49bd3935a50baab737"`);
        await queryRunner.query(`ALTER TABLE "user_shared_album" DROP CONSTRAINT "FK_f48513bf9bccefd6ff3ad30bd06"`);
        await queryRunner.query(`DROP INDEX "IDX_427c350ad49bd3935a50baab73"`);
        await queryRunner.query(`DROP INDEX "IDX_f48513bf9bccefd6ff3ad30bd0"`);
        await queryRunner.query(`DROP INDEX "IDX_e590fa396c6898fcd4a50e4092"`);
        await queryRunner.query(`DROP INDEX "IDX_4bd1303d199f4e72ccdf998c62"`);

        await queryRunner.query(`ALTER TABLE "albums" DROP CONSTRAINT "FK_b22c53f35ef20c28c21637c85f4"`);
        await queryRunner.query(
          `ALTER TABLE "albums" ADD CONSTRAINT "FK_b22c53f35ef20c28c21637c85f4" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );

        await queryRunner.query(`ALTER TABLE "user_shared_album" DROP CONSTRAINT "PK_7df55657e0b2e8b626330a0ebc8"`);
        await queryRunner.query(`ALTER TABLE "user_shared_album" ADD CONSTRAINT "PK_323f8dcbe85373722886940f143" PRIMARY KEY ("albumsId")`);
        await queryRunner.query(`ALTER TABLE "user_shared_album" DROP COLUMN "usersId"`);
        await queryRunner.query(`ALTER TABLE "user_shared_album" DROP CONSTRAINT "PK_323f8dcbe85373722886940f143"`);
        await queryRunner.query(`ALTER TABLE "user_shared_album" DROP COLUMN "albumsId"`);
        await queryRunner.query(`ALTER TABLE "user_shared_album" ADD "sharedUserId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_shared_album" ADD "albumId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_shared_album" ADD "id" SERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_shared_album" ADD CONSTRAINT "PK_b6562316a98845a7b3e9a25cdd0" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "user_shared_album" ADD CONSTRAINT "PK_unique_user_in_album" UNIQUE ("albumId", "sharedUserId")`);
        await queryRunner.query(`ALTER TABLE "user_shared_album" ADD CONSTRAINT "FK_7b3bf0f5f8da59af30519c25f18" FOREIGN KEY ("albumId") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_shared_album" ADD CONSTRAINT "FK_543c31211653e63e080ba882eb5" FOREIGN KEY ("sharedUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

        await queryRunner.query(`ALTER TABLE "asset_album" DROP CONSTRAINT "PK_c67bc36fa845fb7b18e0e398180"`);
        await queryRunner.query(`ALTER TABLE "asset_album" ADD CONSTRAINT "PK_b4f2e5b96efc25cbccd80a04f7a" PRIMARY KEY ("albumsId")`);
        await queryRunner.query(`ALTER TABLE "asset_album" DROP CONSTRAINT "PK_b4f2e5b96efc25cbccd80a04f7a"`);
        await queryRunner.query(`ALTER TABLE "asset_album" RENAME COLUMN "albumsId" TO "albumId"`);
        await queryRunner.query(`ALTER TABLE "asset_album" RENAME COLUMN "assetsId" TO "assetId"`);
        await queryRunner.query(`ALTER TABLE "asset_album" ADD "id" SERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "asset_album" ADD CONSTRAINT "PK_a34e076afbc601d81938e2c2277" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "asset_album" ADD CONSTRAINT "UQ_unique_asset_in_album" UNIQUE ("albumId", "assetId")`);
        await queryRunner.query(`ALTER TABLE "asset_album" ADD CONSTRAINT "FK_256a30a03a4a0aff0394051397d" FOREIGN KEY ("albumId") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "asset_album" ADD CONSTRAINT "FK_7ae4e03729895bf87e056d7b598" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
