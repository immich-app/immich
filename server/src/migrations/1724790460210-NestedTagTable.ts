import { MigrationInterface, QueryRunner } from "typeorm";

export class NestedTagTable1724790460210 implements MigrationInterface {
    name = 'NestedTagTable1724790460210'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('TRUNCATE TABLE "tags" CASCADE');
        await queryRunner.query(`ALTER TABLE "tags" DROP CONSTRAINT "FK_92e67dc508c705dd66c94615576"`);
        await queryRunner.query(`ALTER TABLE "tags" DROP CONSTRAINT "UQ_tag_name_userId"`);
        await queryRunner.query(`CREATE TABLE "tags_closure" ("id_ancestor" uuid NOT NULL, "id_descendant" uuid NOT NULL, CONSTRAINT "PK_eab38eb12a3ec6df8376c95477c" PRIMARY KEY ("id_ancestor", "id_descendant"))`);
        await queryRunner.query(`CREATE INDEX "IDX_15fbcbc67663c6bfc07b354c22" ON "tags_closure" ("id_ancestor") `);
        await queryRunner.query(`CREATE INDEX "IDX_b1a2a7ed45c29179b5ad51548a" ON "tags_closure" ("id_descendant") `);
        await queryRunner.query(`ALTER TABLE "tags" DROP COLUMN "renameTagId"`);
        await queryRunner.query(`ALTER TABLE "tags" DROP COLUMN "type"`);
        await queryRunner.query(`ALTER TABLE "tags" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "tags" ADD "value" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tags" ADD CONSTRAINT "UQ_d090e09fe86ebe2ec0aec27b451" UNIQUE ("value")`);
        await queryRunner.query(`ALTER TABLE "tags" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "tags" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "tags" ADD "color" character varying`);
        await queryRunner.query(`ALTER TABLE "tags" ADD "parentId" uuid`);
        await queryRunner.query(`ALTER TABLE "tags" ADD CONSTRAINT "FK_9f9590cc11561f1f48ff034ef99" FOREIGN KEY ("parentId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tags" ADD CONSTRAINT "FK_92e67dc508c705dd66c94615576" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "tags_closure" ADD CONSTRAINT "FK_15fbcbc67663c6bfc07b354c22c" FOREIGN KEY ("id_ancestor") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tags_closure" ADD CONSTRAINT "FK_b1a2a7ed45c29179b5ad51548a1" FOREIGN KEY ("id_descendant") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tag_asset" DROP CONSTRAINT "FK_e99f31ea4cdf3a2c35c7287eb42"`);
        await queryRunner.query(`ALTER TABLE "tag_asset" DROP CONSTRAINT "FK_f8e8a9e893cb5c54907f1b798e9"`);
        await queryRunner.query(`ALTER TABLE "tag_asset" ADD CONSTRAINT "FK_f8e8a9e893cb5c54907f1b798e9" FOREIGN KEY ("assetsId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "tag_asset" ADD CONSTRAINT "FK_e99f31ea4cdf3a2c35c7287eb42" FOREIGN KEY ("tagsId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tag_asset" DROP CONSTRAINT "FK_e99f31ea4cdf3a2c35c7287eb42"`);
        await queryRunner.query(`ALTER TABLE "tag_asset" DROP CONSTRAINT "FK_f8e8a9e893cb5c54907f1b798e9"`);
        await queryRunner.query(`ALTER TABLE "tag_asset" ADD CONSTRAINT "FK_f8e8a9e893cb5c54907f1b798e9" FOREIGN KEY ("assetsId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "tag_asset" ADD CONSTRAINT "FK_e99f31ea4cdf3a2c35c7287eb42" FOREIGN KEY ("tagsId") REFERENCES "tags"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tags_closure" DROP CONSTRAINT "FK_b1a2a7ed45c29179b5ad51548a1"`);
        await queryRunner.query(`ALTER TABLE "tags_closure" DROP CONSTRAINT "FK_15fbcbc67663c6bfc07b354c22c"`);
        await queryRunner.query(`ALTER TABLE "tags" DROP CONSTRAINT "FK_92e67dc508c705dd66c94615576"`);
        await queryRunner.query(`ALTER TABLE "tags" DROP CONSTRAINT "FK_9f9590cc11561f1f48ff034ef99"`);
        await queryRunner.query(`ALTER TABLE "tags" DROP COLUMN "parentId"`);
        await queryRunner.query(`ALTER TABLE "tags" DROP COLUMN "color"`);
        await queryRunner.query(`ALTER TABLE "tags" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "tags" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "tags" DROP CONSTRAINT "UQ_d090e09fe86ebe2ec0aec27b451"`);
        await queryRunner.query(`ALTER TABLE "tags" DROP COLUMN "value"`);
        await queryRunner.query(`ALTER TABLE "tags" ADD "name" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tags" ADD "type" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tags" ADD "renameTagId" uuid`);
        await queryRunner.query(`DROP INDEX "IDX_b1a2a7ed45c29179b5ad51548a"`);
        await queryRunner.query(`DROP INDEX "IDX_15fbcbc67663c6bfc07b354c22"`);
        await queryRunner.query(`DROP TABLE "tags_closure"`);
        await queryRunner.query(`ALTER TABLE "tags" ADD CONSTRAINT "UQ_tag_name_userId" UNIQUE ("name", "userId")`);
        await queryRunner.query(`ALTER TABLE "tags" ADD CONSTRAINT "FK_92e67dc508c705dd66c94615576" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
