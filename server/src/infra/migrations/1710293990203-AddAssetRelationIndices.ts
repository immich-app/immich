import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAssetRelationIndices1710293990203 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        queryRunner.query(`CREATE INDEX IDX_asset_id_stackId on assets ("id", "stackId")`);
        queryRunner.query(`CREATE INDEX IDX_tag_asset_assetsId_tagsId on tag_asset ("assetsId", "tagsId")`);
        queryRunner.query(`CREATE INDEX IDX_asset_faces_assetId_personId on asset_faces ("assetId", "personId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        queryRunner.query(`DROP INDEX IDX_asset_id_stackId on assets ("id", "stackId")`);
        queryRunner.query(`DROP INDEX IDX_tag_asset_assetsId_tagsId on tag_asset ("assetsId", "tagsId")`);
        queryRunner.query(`DROP INDEX IDX_asset_faces_assetId_personId on asset_faces ("assetId", "personId")`);
    }
}
