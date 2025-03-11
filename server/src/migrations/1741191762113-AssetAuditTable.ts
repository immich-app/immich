import { MigrationInterface, QueryRunner } from "typeorm";

export class AssetAuditTable1741191762113 implements MigrationInterface {
    name = 'AssetAuditTable1741191762113'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "assets_audit" ("id" uuid NOT NULL DEFAULT immich_uuid_v7(), "assetId" uuid NOT NULL, "ownerId" uuid NOT NULL, "deletedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT clock_timestamp(), CONSTRAINT "PK_99bd5c015f81a641927a32b4212" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_assets_audit_asset_id" ON "assets_audit" ("assetId") `);
        await queryRunner.query(`CREATE INDEX "IDX_assets_audit_owner_id" ON "assets_audit" ("ownerId") `);
        await queryRunner.query(`CREATE INDEX "IDX_assets_audit_deleted_at" ON "assets_audit" ("deletedAt") `);
        await queryRunner.query(`CREATE OR REPLACE FUNCTION assets_delete_audit() RETURNS TRIGGER AS
          $$
           BEGIN
            INSERT INTO assets_audit ("assetId", "ownerId")
            SELECT "id", "ownerId"
            FROM OLD;
            RETURN NULL;
           END;
          $$ LANGUAGE plpgsql`
        );
        await queryRunner.query(`CREATE OR REPLACE TRIGGER assets_delete_audit
           AFTER DELETE ON assets
           REFERENCING OLD TABLE AS OLD
           FOR EACH STATEMENT
           EXECUTE FUNCTION assets_delete_audit();
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TRIGGER assets_delete_audit`);
        await queryRunner.query(`DROP FUNCTION assets_delete_audit`);
        await queryRunner.query(`DROP INDEX "IDX_assets_audit_deleted_at"`);
        await queryRunner.query(`DROP INDEX "IDX_assets_audit_owner_id"`);
        await queryRunner.query(`DROP INDEX "IDX_assets_audit_asset_id"`);
        await queryRunner.query(`DROP TABLE "assets_audit"`);
    }
}
