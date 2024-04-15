import { MigrationInterface, QueryRunner } from 'typeorm';

export class Nanoid1713131136153 implements MigrationInterface {
  name = 'Nanoid1713131136153';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "asset_job_status" DROP CONSTRAINT "FK_420bec36fc02813bddf5c8b73d4"`);
    await queryRunner.query(`ALTER TABLE "asset_job_status" DROP CONSTRAINT "PK_420bec36fc02813bddf5c8b73d4"`);
    await queryRunner.query(`ALTER TABLE "asset_job_status" ALTER COLUMN "assetId" TYPE character varying`);
    await queryRunner.query(`ALTER TABLE "asset_job_status" ALTER COLUMN "assetId" SET NOT NULL`);

    await queryRunner.query(
      `ALTER TABLE "asset_job_status" ADD CONSTRAINT "PK_420bec36fc02813bddf5c8b73d4" PRIMARY KEY ("assetId")`,
    );
    await queryRunner.query(`ALTER TABLE "asset_stack" DROP CONSTRAINT "FK_91704e101438fd0653f582426dc"`);
    await queryRunner.query(`ALTER TABLE "asset_stack" DROP CONSTRAINT "REL_91704e101438fd0653f582426d"`);
    await queryRunner.query(`ALTER TABLE "asset_stack" ALTER COLUMN "primaryAssetId" TYPE character varying`);
    await queryRunner.query(`ALTER TABLE "asset_stack" ALTER COLUMN "primaryAssetId" SET NOT NULL`);

    await queryRunner.query(
      `ALTER TABLE "asset_stack" ADD CONSTRAINT "UQ_91704e101438fd0653f582426dc" UNIQUE ("primaryAssetId")`,
    );
    await queryRunner.query(`ALTER TABLE "exif" DROP CONSTRAINT "FK_c0117fdbc50b917ef9067740c44"`);
    await queryRunner.query(`ALTER TABLE "exif" DROP CONSTRAINT "PK_c0117fdbc50b917ef9067740c44"`);
    await queryRunner.query(`ALTER TABLE "exif" ALTER COLUMN "assetId" TYPE character varying`);
    await queryRunner.query(`ALTER TABLE "exif" ALTER COLUMN "assetId" SET NOT NULL`);

    await queryRunner.query(
      `ALTER TABLE "exif" ADD CONSTRAINT "PK_c0117fdbc50b917ef9067740c44" PRIMARY KEY ("assetId")`,
    );

    await queryRunner.query(`ALTER TABLE "memories_assets_assets" DROP CONSTRAINT "FK_6942ecf52d75d4273de19d2c16f"`);
    await queryRunner.query(`ALTER TABLE "memories_assets_assets" ALTER COLUMN "assetsId" TYPE character varying`);
    await queryRunner.query(`ALTER TABLE "memories_assets_assets" ALTER COLUMN "assetsId" SET NOT NULL`);

    await queryRunner.query(`ALTER TABLE "shared_link__asset" DROP CONSTRAINT "FK_5b7decce6c8d3db9593d6111a66"`);
    await queryRunner.query(`ALTER TABLE "albums_assets_assets" DROP CONSTRAINT "FK_4bd1303d199f4e72ccdf998c621"`);
    await queryRunner.query(`ALTER TABLE "albums_assets_assets" ALTER COLUMN "assetsId" TYPE character varying`);
    await queryRunner.query(`ALTER TABLE "albums_assets_assets" ALTER COLUMN "assetsId" SET NOT NULL`);

    await queryRunner.query(`ALTER TABLE "activity" DROP CONSTRAINT "FK_8091ea76b12338cb4428d33d782"`);
    await queryRunner.query(`ALTER TABLE "assets" DROP CONSTRAINT "FK_16294b83fa8c0149719a1f631ef"`);
    await queryRunner.query(`ALTER TABLE "albums" DROP CONSTRAINT "FK_05895aa505a670300d4816debce"`);

    await queryRunner.query(`DROP INDEX "public"."IDX_asset_id_stackId"`);

    await queryRunner.query(`ALTER TABLE "tag_asset" DROP CONSTRAINT "PK_ef5346fe522b5fb3bc96454747e"`);
    await queryRunner.query(`ALTER TABLE "tag_asset" DROP CONSTRAINT "FK_f8e8a9e893cb5c54907f1b798e9"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_tag_asset_assetsId_tagsId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f8e8a9e893cb5c54907f1b798e"`);

    await queryRunner.query(`ALTER TABLE "tag_asset" ALTER COLUMN "assetsId" TYPE character varying`);
    await queryRunner.query(`ALTER TABLE "tag_asset" ALTER COLUMN "assetsId" SET NOT NULL`);

    await queryRunner.query(
      `ALTER TABLE "tag_asset" ADD CONSTRAINT "PK_ef5346fe522b5fb3bc96454747e" PRIMARY KEY ("assetsId", "tagsId")`,
    );

    await queryRunner.query(`CREATE INDEX "IDX_tag_asset_assetsId_tagsId" on tag_asset ("assetsId", "tagsId")`);

    await queryRunner.query(`ALTER TABLE "smart_info" DROP CONSTRAINT "PK_5e3753aadd956110bf3ec0244ac"`);
    await queryRunner.query(`ALTER TABLE "smart_info" DROP CONSTRAINT "FK_5e3753aadd956110bf3ec0244ac"`);
    await queryRunner.query(`ALTER TABLE "smart_info" ALTER COLUMN "assetId" TYPE character varying`);
    await queryRunner.query(`ALTER TABLE "smart_info" ALTER COLUMN "assetId" SET NOT NULL`);

    await queryRunner.query(`ALTER TABLE "smart_search" DROP CONSTRAINT "smart_search_assetId_fkey"`);
    await queryRunner.query(`ALTER TABLE "smart_search" ALTER COLUMN "assetId" TYPE character varying`);
    await queryRunner.query(`ALTER TABLE "smart_search" ALTER COLUMN "assetId" SET NOT NULL`);

    await queryRunner.query(`ALTER TABLE "asset_faces" DROP CONSTRAINT "FK_02a43fd0b3c50fb6d7f0cb7282c"`);
    await queryRunner.query(`ALTER TABLE "asset_faces" ALTER COLUMN "assetId" TYPE character varying`);
    await queryRunner.query(`ALTER TABLE "asset_faces" ALTER COLUMN "assetId" SET NOT NULL`);

    await queryRunner.query(`ALTER TABLE "assets" DROP CONSTRAINT "PK_da96729a8b113377cfb6a62439c"`);
    await queryRunner.query(`ALTER TABLE "assets" ALTER COLUMN "id" TYPE character varying(36)`);
    await queryRunner.query(`ALTER TABLE "assets" ALTER COLUMN "id" SET NOT NULL`);

    await queryRunner.query(`ALTER TABLE "assets" ADD CONSTRAINT "PK_da96729a8b113377cfb6a62439c" PRIMARY KEY ("id")`);
    await queryRunner.query(`ALTER TABLE "assets" DROP CONSTRAINT "UQ_16294b83fa8c0149719a1f631ef"`);
    await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "livePhotoVideoId"`);
    await queryRunner.query(`ALTER TABLE "assets" ADD "livePhotoVideoId" character varying`);
    await queryRunner.query(
      `ALTER TABLE "assets" ADD CONSTRAINT "UQ_16294b83fa8c0149719a1f631ef" UNIQUE ("livePhotoVideoId")`,
    );
    await queryRunner.query(`ALTER TABLE "albums" DROP COLUMN "albumThumbnailAssetId"`);
    await queryRunner.query(`ALTER TABLE "albums" ADD "albumThumbnailAssetId" character varying`);
    await queryRunner.query(`COMMENT ON COLUMN "albums"."albumThumbnailAssetId" IS 'Asset ID to be used as thumbnail'`);
    await queryRunner.query(`DROP INDEX "public"."IDX_activity_like"`);
    await queryRunner.query(`ALTER TABLE "activity" ALTER COLUMN "assetId" TYPE character varying`);

    await queryRunner.query(`ALTER TABLE "shared_link__asset" DROP CONSTRAINT "PK_9b4f3687f9b31d1e311336b05e3"`);
    await queryRunner.query(
      `ALTER TABLE "shared_link__asset" ADD CONSTRAINT "PK_c9fab4aa97ffd1b034f3d6581ab" PRIMARY KEY ("sharedLinksId")`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_5b7decce6c8d3db9593d6111a6"`);
    await queryRunner.query(`ALTER TABLE "shared_link__asset" ALTER COLUMN "assetsId" TYPE character varying`);
    await queryRunner.query(`ALTER TABLE "shared_link__asset" ALTER COLUMN "assetsId" SET NOT NULL`);

    await queryRunner.query(`ALTER TABLE "shared_link__asset" DROP CONSTRAINT "PK_c9fab4aa97ffd1b034f3d6581ab"`);
    await queryRunner.query(
      `ALTER TABLE "shared_link__asset" ADD CONSTRAINT "PK_9b4f3687f9b31d1e311336b05e3" PRIMARY KEY ("sharedLinksId", "assetsId")`,
    );

    await queryRunner.query(`ALTER TABLE "memories_assets_assets" DROP CONSTRAINT "PK_fcaf7112a013d1703c011c6793d"`);
    await queryRunner.query(
      `ALTER TABLE "memories_assets_assets" ADD CONSTRAINT "PK_984e5c9ab1f04d34538cd32334e" PRIMARY KEY ("memoriesId")`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_6942ecf52d75d4273de19d2c16"`);

    await queryRunner.query(`ALTER TABLE "memories_assets_assets" DROP CONSTRAINT "PK_984e5c9ab1f04d34538cd32334e"`);
    await queryRunner.query(
      `ALTER TABLE "memories_assets_assets" ADD CONSTRAINT "PK_fcaf7112a013d1703c011c6793d" PRIMARY KEY ("memoriesId", "assetsId")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_asset_id_stackId" ON "assets" ("id", "stackId") `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_activity_like" ON "activity" ("assetId", "userId", "albumId") WHERE ("isLiked" = true)`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_5b7decce6c8d3db9593d6111a6" ON "shared_link__asset" ("assetsId") `);
    await queryRunner.query(`CREATE INDEX "IDX_6942ecf52d75d4273de19d2c16" ON "memories_assets_assets" ("assetsId") `);
    await queryRunner.query(
      `ALTER TABLE "asset_job_status" ADD CONSTRAINT "FK_420bec36fc02813bddf5c8b73d4" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_stack" ADD CONSTRAINT "FK_91704e101438fd0653f582426dc" FOREIGN KEY ("primaryAssetId") REFERENCES "assets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "exif" ADD CONSTRAINT "FK_c0117fdbc50b917ef9067740c44" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "assets" ADD CONSTRAINT "FK_16294b83fa8c0149719a1f631ef" FOREIGN KEY ("livePhotoVideoId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "albums" ADD CONSTRAINT "FK_05895aa505a670300d4816debce" FOREIGN KEY ("albumThumbnailAssetId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity" ADD CONSTRAINT "FK_8091ea76b12338cb4428d33d782" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "shared_link__asset" ADD CONSTRAINT "FK_5b7decce6c8d3db9593d6111a66" FOREIGN KEY ("assetsId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "albums_assets_assets" ADD CONSTRAINT "FK_4bd1303d199f4e72ccdf998c621" FOREIGN KEY ("assetsId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "memories_assets_assets" ADD CONSTRAINT "FK_6942ecf52d75d4273de19d2c16f" FOREIGN KEY ("assetsId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_f8e8a9e893cb5c54907f1b798e" ON "tag_asset" ("assetsId") `);
    await queryRunner.query(
      `ALTER TABLE "tag_asset" ADD CONSTRAINT "FK_f8e8a9e893cb5c54907f1b798e9" FOREIGN KEY ("assetsId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );

    await queryRunner.query(
      `ALTER TABLE "smart_info" ADD CONSTRAINT "PK_5e3753aadd956110bf3ec0244ac" PRIMARY KEY ("assetId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "smart_info" ADD CONSTRAINT "FK_5e3753aadd956110bf3ec0244ac" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "smart_search" ADD CONSTRAINT "smart_search_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_faces" ADD CONSTRAINT "FK_02a43fd0b3c50fb6d7f0cb7282c" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // await queryRunner.query(`ALTER TABLE "assets" ALTER COLUMN id TYPE uuid `);
    // await queryRunner.query(`ALTER TABLE "assets" ALTER COLUMN id SET DEFUALT uuid_generate_v4()`);
    // await queryRunner.query(`ALTER TABLE "assets" ALTER COLUMN id SET NOT NULL `);
    // await queryRunner.query(`ALTER TABLE "assets" ALTER COLUMN id TYPE uuid `);
    // await queryRunner.query(`ALTER TABLE "memories_assets_assets" DROP CONSTRAINT "FK_6942ecf52d75d4273de19d2c16f"`);
    // await queryRunner.query(`ALTER TABLE "albums_assets_assets" DROP CONSTRAINT "FK_4bd1303d199f4e72ccdf998c621"`);
    // await queryRunner.query(`ALTER TABLE "shared_link__asset" DROP CONSTRAINT "FK_5b7decce6c8d3db9593d6111a66"`);
    // await queryRunner.query(`ALTER TABLE "activity" DROP CONSTRAINT "FK_8091ea76b12338cb4428d33d782"`);
    // await queryRunner.query(`ALTER TABLE "albums" DROP CONSTRAINT "FK_05895aa505a670300d4816debce"`);
    // await queryRunner.query(`ALTER TABLE "assets" DROP CONSTRAINT "FK_16294b83fa8c0149719a1f631ef"`);
    // await queryRunner.query(`ALTER TABLE "exif" DROP CONSTRAINT "FK_c0117fdbc50b917ef9067740c44"`);
    // await queryRunner.query(`ALTER TABLE "asset_stack" DROP CONSTRAINT "FK_91704e101438fd0653f582426dc"`);
    // await queryRunner.query(`ALTER TABLE "asset_job_status" DROP CONSTRAINT "FK_420bec36fc02813bddf5c8b73d4"`);
    // await queryRunner.query(`DROP INDEX "public"."IDX_6942ecf52d75d4273de19d2c16"`);
    // await queryRunner.query(`DROP INDEX "public"."IDX_4bd1303d199f4e72ccdf998c62"`);
    // await queryRunner.query(`DROP INDEX "public"."IDX_5b7decce6c8d3db9593d6111a6"`);
    // await queryRunner.query(`DROP INDEX "public"."IDX_activity_like"`);
    // await queryRunner.query(`DROP INDEX "public"."IDX_asset_id_stackId"`);
    // await queryRunner.query(`ALTER TABLE "memories_assets_assets" DROP CONSTRAINT "PK_fcaf7112a013d1703c011c6793d"`);
    // await queryRunner.query(
    //   `ALTER TABLE "memories_assets_assets" ADD CONSTRAINT "PK_984e5c9ab1f04d34538cd32334e" PRIMARY KEY ("memoriesId")`,
    // );
    // await queryRunner.query(`ALTER TABLE "memories_assets_assets" DROP COLUMN "assetsId"`);
    // await queryRunner.query(`ALTER TABLE "memories_assets_assets" ADD "assetsId" uuid NOT NULL`);
    // await queryRunner.query(`CREATE INDEX "IDX_6942ecf52d75d4273de19d2c16" ON "memories_assets_assets" ("assetsId") `);
    // await queryRunner.query(`ALTER TABLE "memories_assets_assets" DROP CONSTRAINT "PK_984e5c9ab1f04d34538cd32334e"`);
    // await queryRunner.query(
    //   `ALTER TABLE "memories_assets_assets" ADD CONSTRAINT "PK_fcaf7112a013d1703c011c6793d" PRIMARY KEY ("memoriesId", "assetsId")`,
    // );
    // await queryRunner.query(`ALTER TABLE "albums_assets_assets" DROP CONSTRAINT "PK_c67bc36fa845fb7b18e0e398180"`);
    // await queryRunner.query(
    //   `ALTER TABLE "albums_assets_assets" ADD CONSTRAINT "PK_c67bc36fa845fb7b18e0e398180" PRIMARY KEY ("albumsId")`,
    // );
    // await queryRunner.query(`ALTER TABLE "albums_assets_assets" DROP COLUMN "assetsId"`);
    // await queryRunner.query(`ALTER TABLE "albums_assets_assets" ADD "assetsId" uuid NOT NULL`);
    // await queryRunner.query(`CREATE INDEX "IDX_4bd1303d199f4e72ccdf998c62" ON "albums_assets_assets" ("assetsId") `);
    // await queryRunner.query(`ALTER TABLE "albums_assets_assets" DROP CONSTRAINT "PK_c67bc36fa845fb7b18e0e398180"`);
    // await queryRunner.query(
    //   `ALTER TABLE "albums_assets_assets" ADD CONSTRAINT "PK_c67bc36fa845fb7b18e0e398180" PRIMARY KEY ("albumsId", "assetsId")`,
    // );
    // await queryRunner.query(`ALTER TABLE "shared_link__asset" DROP CONSTRAINT "PK_9b4f3687f9b31d1e311336b05e3"`);
    // await queryRunner.query(
    //   `ALTER TABLE "shared_link__asset" ADD CONSTRAINT "PK_c9fab4aa97ffd1b034f3d6581ab" PRIMARY KEY ("sharedLinksId")`,
    // );
    // await queryRunner.query(`ALTER TABLE "shared_link__asset" DROP COLUMN "assetsId"`);
    // await queryRunner.query(`ALTER TABLE "shared_link__asset" ADD "assetsId" uuid NOT NULL`);
    // await queryRunner.query(`CREATE INDEX "IDX_5b7decce6c8d3db9593d6111a6" ON "shared_link__asset" ("assetsId") `);
    // await queryRunner.query(`ALTER TABLE "shared_link__asset" DROP CONSTRAINT "PK_c9fab4aa97ffd1b034f3d6581ab"`);
    // await queryRunner.query(
    //   `ALTER TABLE "shared_link__asset" ADD CONSTRAINT "PK_9b4f3687f9b31d1e311336b05e3" PRIMARY KEY ("assetsId", "sharedLinksId")`,
    // );
    // await queryRunner.query(`ALTER TABLE "activity" DROP COLUMN "assetId"`);
    // await queryRunner.query(`ALTER TABLE "activity" ADD "assetId" uuid`);
    // await queryRunner.query(
    //   `CREATE UNIQUE INDEX "IDX_activity_like" ON "activity" ("albumId", "userId", "assetId") WHERE ("isLiked" = true)`,
    // );
    // await queryRunner.query(`COMMENT ON COLUMN "albums"."albumThumbnailAssetId" IS 'Asset ID to be used as thumbnail'`);
    // await queryRunner.query(`ALTER TABLE "albums" DROP COLUMN "albumThumbnailAssetId"`);
    // await queryRunner.query(`ALTER TABLE "albums" ADD "albumThumbnailAssetId" uuid`);
    // await queryRunner.query(`ALTER TABLE "assets" DROP CONSTRAINT "UQ_16294b83fa8c0149719a1f631ef"`);
    // await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "livePhotoVideoId"`);
    // await queryRunner.query(`ALTER TABLE "assets" ADD "livePhotoVideoId" uuid`);
    // await queryRunner.query(
    //   `ALTER TABLE "assets" ADD CONSTRAINT "UQ_16294b83fa8c0149719a1f631ef" UNIQUE ("livePhotoVideoId")`,
    // );
    // await queryRunner.query(`ALTER TABLE "assets" DROP CONSTRAINT "PK_da96729a8b113377cfb6a62439c"`);
    // await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "id"`);
    // await queryRunner.query(`ALTER TABLE "assets" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
    // await queryRunner.query(`ALTER TABLE "assets" ADD CONSTRAINT "PK_da96729a8b113377cfb6a62439c" PRIMARY KEY ("id")`);
    // await queryRunner.query(`CREATE INDEX "IDX_asset_id_stackId" ON "assets" ("id", "stackId") `);
    // await queryRunner.query(
    //   `ALTER TABLE "albums" ADD CONSTRAINT "FK_05895aa505a670300d4816debce" FOREIGN KEY ("albumThumbnailAssetId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "assets" ADD CONSTRAINT "FK_16294b83fa8c0149719a1f631ef" FOREIGN KEY ("livePhotoVideoId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "activity" ADD CONSTRAINT "FK_8091ea76b12338cb4428d33d782" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "albums_assets_assets" ADD CONSTRAINT "FK_4bd1303d199f4e72ccdf998c621" FOREIGN KEY ("assetsId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "shared_link__asset" ADD CONSTRAINT "FK_5b7decce6c8d3db9593d6111a66" FOREIGN KEY ("assetsId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "memories_assets_assets" ADD CONSTRAINT "FK_6942ecf52d75d4273de19d2c16f" FOREIGN KEY ("assetsId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    // );
    // await queryRunner.query(
    //   `DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "database" = $3 AND "schema" = $4 AND "table" = $5`,
    //   ['GENERATED_COLUMN', 'exifTextSearchableColumn', 'immich-test', 'public', 'exif'],
    // );
    // await queryRunner.query(`ALTER TABLE "exif" DROP COLUMN "exifTextSearchableColumn"`);
    // await queryRunner.query(
    //   `INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES ($1, $2, $3, $4, $5, $6)`,
    //   ['immich-test', 'public', 'exif', 'GENERATED_COLUMN', 'exifTextSearchableColumn', ''],
    // );
    // await queryRunner.query(`ALTER TABLE "exif" ADD "exifTextSearchableColumn" tsvector NOT NULL`);
    // await queryRunner.query(`ALTER TABLE "exif" DROP CONSTRAINT "PK_c0117fdbc50b917ef9067740c44"`);
    // await queryRunner.query(`ALTER TABLE "exif" DROP COLUMN "assetId"`);
    // await queryRunner.query(`ALTER TABLE "exif" ADD "assetId" uuid NOT NULL`);
    // await queryRunner.query(
    //   `ALTER TABLE "exif" ADD CONSTRAINT "PK_c0117fdbc50b917ef9067740c44" PRIMARY KEY ("assetId")`,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "exif" ADD CONSTRAINT "FK_c0117fdbc50b917ef9067740c44" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    // );
    // await queryRunner.query(`ALTER TABLE "asset_stack" DROP CONSTRAINT "UQ_91704e101438fd0653f582426dc"`);
    // await queryRunner.query(`ALTER TABLE "asset_stack" DROP COLUMN "primaryAssetId"`);
    // await queryRunner.query(`ALTER TABLE "asset_stack" ADD "primaryAssetId" uuid NOT NULL`);
    // await queryRunner.query(
    //   `ALTER TABLE "asset_stack" ADD CONSTRAINT "REL_91704e101438fd0653f582426d" UNIQUE ("primaryAssetId")`,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "asset_stack" ADD CONSTRAINT "FK_91704e101438fd0653f582426dc" FOREIGN KEY ("primaryAssetId") REFERENCES "assets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    // );
    // await queryRunner.query(`ALTER TABLE "asset_job_status" DROP CONSTRAINT "PK_420bec36fc02813bddf5c8b73d4"`);
    // await queryRunner.query(`ALTER TABLE "asset_job_status" DROP COLUMN "assetId"`);
    // await queryRunner.query(`ALTER TABLE "asset_job_status" ADD "assetId" uuid NOT NULL`);
    // await queryRunner.query(
    //   `ALTER TABLE "asset_job_status" ADD CONSTRAINT "PK_420bec36fc02813bddf5c8b73d4" PRIMARY KEY ("assetId")`,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "asset_job_status" ADD CONSTRAINT "FK_420bec36fc02813bddf5c8b73d4" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    // );
  }
}
