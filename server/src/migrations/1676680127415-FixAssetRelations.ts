import { MigrationInterface, QueryRunner } from "typeorm";

export class FixAssetRelations1676680127415 implements MigrationInterface {
    name = 'FixAssetRelations1676680127415'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assets" RENAME COLUMN "modifiedAt" TO "fileModifiedAt"`);
        await queryRunner.query(`ALTER TABLE "assets" RENAME COLUMN "createdAt" TO "fileCreatedAt"`);

        await queryRunner.query(`ALTER TABLE "assets" RENAME COLUMN "userId" TO "ownerId"`);
        await queryRunner.query(`ALTER TABLE assets ALTER COLUMN "ownerId" TYPE uuid USING "ownerId"::uuid;`);

        await queryRunner.query(`ALTER TABLE "assets" ADD CONSTRAINT "UQ_16294b83fa8c0149719a1f631ef" UNIQUE ("livePhotoVideoId")`);
        await queryRunner.query(`ALTER TABLE "assets" ADD CONSTRAINT "FK_2c5ac0d6fb58b238fd2068de67d" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "assets" ADD CONSTRAINT "FK_16294b83fa8c0149719a1f631ef" FOREIGN KEY ("livePhotoVideoId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assets" DROP CONSTRAINT "FK_16294b83fa8c0149719a1f631ef"`);
        await queryRunner.query(`ALTER TABLE "assets" DROP CONSTRAINT "FK_2c5ac0d6fb58b238fd2068de67d"`);
        await queryRunner.query(`ALTER TABLE "assets" DROP CONSTRAINT "UQ_16294b83fa8c0149719a1f631ef"`);

        await queryRunner.query(`ALTER TABLE "assets" RENAME COLUMN "fileCreatedAt" TO "createdAt"`);
        await queryRunner.query(`ALTER TABLE "assets" RENAME COLUMN "fileModifiedAt" TO "modifiedAt"`);

        await queryRunner.query(`ALTER TABLE "assets" RENAME COLUMN "ownerId" TO "userId"`);
        await queryRunner.query(`ALTER TABLE assets ALTER COLUMN "userId" TYPE varchar`);
    }

}
