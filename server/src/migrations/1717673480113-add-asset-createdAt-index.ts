import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAssetCreatedAtIndex1717673480113 implements MigrationInterface {
    name = 'AddAssetCreatedAtIndex1717673480113'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "idx_asset_created_at" ON "assets" ("createdAt") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_asset_created_at"`);
    }

}
