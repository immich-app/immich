import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTagsTable1669756815674 implements MigrationInterface {
    name = 'CreateTagsTable1669756815674'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "tags" ("id" SERIAL NOT NULL, "assetId" uuid NOT NULL, "type" character varying NOT NULL, "tag" character varying NOT NULL, CONSTRAINT "UQ_unique_tag" UNIQUE ("assetId", "type", "tag"), CONSTRAINT "PK_e7dc17249a1148a1970748eda99" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "tags" ADD CONSTRAINT "FK_1f66b7a8a1b1860fb4728307234" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tags" DROP CONSTRAINT "FK_1f66b7a8a1b1860fb4728307234"`);
        await queryRunner.query(`DROP TABLE "tags"`);
    }

}
