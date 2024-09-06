import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTagsTable1670257571385 implements MigrationInterface {
    name = 'CreateTagsTable1670257571385'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "tags" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" character varying NOT NULL, "name" character varying NOT NULL, "userId" uuid NOT NULL, "renameTagId" uuid, CONSTRAINT "UQ_tag_name_userId" UNIQUE ("name", "userId"), CONSTRAINT "PK_e7dc17249a1148a1970748eda99" PRIMARY KEY ("id")); COMMENT ON COLUMN "tags"."renameTagId" IS 'The new renamed tagId'`);
        await queryRunner.query(`CREATE TABLE "tag_asset" ("assetsId" uuid NOT NULL, "tagsId" uuid NOT NULL, CONSTRAINT "PK_ef5346fe522b5fb3bc96454747e" PRIMARY KEY ("assetsId", "tagsId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f8e8a9e893cb5c54907f1b798e" ON "tag_asset" ("assetsId") `);
        await queryRunner.query(`CREATE INDEX "IDX_e99f31ea4cdf3a2c35c7287eb4" ON "tag_asset" ("tagsId") `);
        await queryRunner.query(`ALTER TABLE "tags" ADD CONSTRAINT "FK_92e67dc508c705dd66c94615576" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tag_asset" ADD CONSTRAINT "FK_f8e8a9e893cb5c54907f1b798e9" FOREIGN KEY ("assetsId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "tag_asset" ADD CONSTRAINT "FK_e99f31ea4cdf3a2c35c7287eb42" FOREIGN KEY ("tagsId") REFERENCES "tags"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tag_asset" DROP CONSTRAINT "FK_e99f31ea4cdf3a2c35c7287eb42"`);
        await queryRunner.query(`ALTER TABLE "tag_asset" DROP CONSTRAINT "FK_f8e8a9e893cb5c54907f1b798e9"`);
        await queryRunner.query(`ALTER TABLE "tags" DROP CONSTRAINT "FK_92e67dc508c705dd66c94615576"`);
        await queryRunner.query(`DROP INDEX "IDX_e99f31ea4cdf3a2c35c7287eb4"`);
        await queryRunner.query(`DROP INDEX "IDX_f8e8a9e893cb5c54907f1b798e"`);
        await queryRunner.query(`DROP TABLE "tag_asset"`);
        await queryRunner.query(`DROP TABLE "tags"`);
    }

}
