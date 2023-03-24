import { MigrationInterface, QueryRunner } from "typeorm";

export class removeChecksumIndex1679662469076 implements MigrationInterface {
    name = 'removeChecksumIndex1679662469076'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_64c507300988dd1764f9a6530c"`);
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
        await queryRunner.query(`CREATE INDEX "IDX_64c507300988dd1764f9a6530c" ON "assets" ("checksum") WHERE ('checksum' IS NOT NULL)`);
    }

}
