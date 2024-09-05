import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSourceColumnToAssetFace1721249222549 implements MigrationInterface {
    name = 'AddSourceColumnToAssetFace1721249222549'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE sourceType AS ENUM ('machine-learning', 'exif');`);
        await queryRunner.query(`ALTER TABLE "asset_faces" ADD "sourceType" sourceType NOT NULL DEFAULT 'machine-learning'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "asset_faces" DROP COLUMN "sourceType"`);
        await queryRunner.query(`DROP TYPE sourceType`);
    }

}
