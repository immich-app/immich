import { MigrationInterface, QueryRunner } from "typeorm";

export class AssetCreatedAtField1676721296440 implements MigrationInterface {
    name = 'AssetCreatedAtField1676721296440'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assets" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "createdAt"`);
    }

}
