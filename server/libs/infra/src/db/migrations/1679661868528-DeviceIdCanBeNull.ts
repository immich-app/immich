import { MigrationInterface, QueryRunner } from "typeorm";

export class deviceidCanBeNull1679661868528 implements MigrationInterface {
    name = 'deviceidCanBeNull1679661868528'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assets" DROP CONSTRAINT "UQ_userid_checksum"`);
        await queryRunner.query(`ALTER TABLE "assets" ALTER COLUMN "deviceAssetId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "assets" ALTER COLUMN "deviceId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "assets" ALTER COLUMN "checksum" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "assets" ADD CONSTRAINT "UQ_userid_checksum" UNIQUE ("ownerId", "checksum")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assets" DROP CONSTRAINT "UQ_userid_checksum"`);
        await queryRunner.query(`ALTER TABLE "assets" ALTER COLUMN "checksum" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "assets" ALTER COLUMN "deviceId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "assets" ALTER COLUMN "deviceAssetId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "assets" ADD CONSTRAINT "UQ_userid_checksum" UNIQUE ("ownerId", "checksum")`);
    }

}
