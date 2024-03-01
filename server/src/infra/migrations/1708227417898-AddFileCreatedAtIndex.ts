import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFileCreatedAtIndex1708227417898 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX idx_asset_file_created_at ON assets ("fileCreatedAt")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX idx_asset_file_created_at`);
    }
}
