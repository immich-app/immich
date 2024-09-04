import { MigrationInterface, QueryRunner } from "typeorm";

export class AddActivity1698693294632 implements MigrationInterface {
    name = 'AddActivity1698693294632'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "activity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "albumId" uuid NOT NULL, "userId" uuid NOT NULL, "assetId" uuid, "comment" text, "isLiked" boolean NOT NULL DEFAULT false, CONSTRAINT "CHK_2ab1e70f113f450eb40c1e3ec8" CHECK (("comment" IS NULL AND "isLiked" = true) OR ("comment" IS NOT NULL AND "isLiked" = false)), CONSTRAINT "PK_24625a1d6b1b089c8ae206fe467" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_activity_like" ON "activity" ("assetId", "userId", "albumId") WHERE ("isLiked" = true)`);
        await queryRunner.query(`ALTER TABLE "activity" ADD CONSTRAINT "FK_8091ea76b12338cb4428d33d782" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "activity" ADD CONSTRAINT "FK_3571467bcbe021f66e2bdce96ea" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "activity" ADD CONSTRAINT "FK_1af8519996fbfb3684b58df280b" FOREIGN KEY ("albumId") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "activity" DROP CONSTRAINT "FK_1af8519996fbfb3684b58df280b"`);
        await queryRunner.query(`ALTER TABLE "activity" DROP CONSTRAINT "FK_3571467bcbe021f66e2bdce96ea"`);
        await queryRunner.query(`ALTER TABLE "activity" DROP CONSTRAINT "FK_8091ea76b12338cb4428d33d782"`);
        await queryRunner.query(`DROP INDEX "IDX_activity_like"`);
        await queryRunner.query(`DROP TABLE "activity"`);
    }

}
