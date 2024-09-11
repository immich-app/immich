import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStackOwner1720207981949 implements MigrationInterface {
    name = 'AddStackOwner1720207981949'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "asset_stack" ADD "ownerId" uuid`);
        await queryRunner.query(`
          UPDATE "asset_stack" stack 
          SET "ownerId" = asset."ownerId" 
          FROM "assets" asset
          WHERE stack."primaryAssetId" = asset."id"
        `)
        await queryRunner.query('ALTER TABLE "asset_stack" ALTER COLUMN "ownerId" SET NOT NULL')
        await queryRunner.query(`ALTER TABLE "asset_stack" ADD CONSTRAINT "FK_c05079e542fd74de3b5ecb5c1c8" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "asset_stack" DROP CONSTRAINT "FK_c05079e542fd74de3b5ecb5c1c8"`);
        await queryRunner.query(`ALTER TABLE "asset_stack" DROP COLUMN "ownerId"`);
    }
}
