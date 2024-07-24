import { MigrationInterface, QueryRunner } from "typeorm";

export class FixLivePhotoVideoRelation1719359859887 implements MigrationInterface {
    name = 'FixLivePhotoVideoRelation1719359859887'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assets" DROP CONSTRAINT "FK_16294b83fa8c0149719a1f631ef"`);
        await queryRunner.query(`ALTER TABLE "assets" DROP CONSTRAINT "UQ_16294b83fa8c0149719a1f631ef"`);
        await queryRunner.query(`ALTER TABLE "assets" ADD CONSTRAINT "FK_16294b83fa8c0149719a1f631ef" FOREIGN KEY ("livePhotoVideoId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assets" DROP CONSTRAINT "FK_16294b83fa8c0149719a1f631ef"`);
        await queryRunner.query(`ALTER TABLE "assets" ADD CONSTRAINT "UQ_16294b83fa8c0149719a1f631ef" UNIQUE ("livePhotoVideoId")`);
        await queryRunner.query(`ALTER TABLE "assets" ADD CONSTRAINT "FK_16294b83fa8c0149719a1f631ef" FOREIGN KEY ("livePhotoVideoId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE`);
    }

}
