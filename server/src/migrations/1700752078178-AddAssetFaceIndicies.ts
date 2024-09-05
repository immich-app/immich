import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAssetFaceIndicies1700752078178 implements MigrationInterface {
    name = 'AddAssetFaceIndicies1700752078178'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_bf339a24070dac7e71304ec530" ON "asset_faces" ("personId", "assetId") `);
        await queryRunner.query(`CREATE INDEX "IDX_b463c8edb01364bf2beba08ef1" ON "assets" ("stackParentId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_b463c8edb01364bf2beba08ef1"`);
        await queryRunner.query(`DROP INDEX "IDX_bf339a24070dac7e71304ec530"`);
    }

}
