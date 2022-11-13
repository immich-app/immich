import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateLivePhotoTable1668354949704 implements MigrationInterface {
    name = 'CreateLivePhotoTable1668354949704'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "live_photos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "assetId" uuid NOT NULL, "originalPath" character varying NOT NULL, "encodedVideoPath" character varying DEFAULT '', CONSTRAINT "REL_d4b10eb0e97bacc5a94a06742c" UNIQUE ("assetId"), CONSTRAINT "PK_f5ec18713b7412fa85b704ec3cf" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_d4b10eb0e97bacc5a94a06742c" ON "live_photos" ("assetId") `);
        await queryRunner.query(`ALTER TABLE "assets" ADD "isLivePhoto" boolean`);
        await queryRunner.query(`ALTER TABLE "live_photos" ADD CONSTRAINT "FK_d4b10eb0e97bacc5a94a06742c5" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "live_photos" DROP CONSTRAINT "FK_d4b10eb0e97bacc5a94a06742c5"`);
        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "isLivePhoto"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d4b10eb0e97bacc5a94a06742c"`);
        await queryRunner.query(`DROP TABLE "live_photos"`);
    }

}
