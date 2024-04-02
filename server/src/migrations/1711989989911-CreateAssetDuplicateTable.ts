import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAssetDuplicateTable1711989989911 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        CREATE TABLE asset_duplicates (
            id uuid,
            "assetId" uuid REFERENCES assets ON UPDATE CASCADE ON DELETE CASCADE,
            PRIMARY KEY (id, "assetId")
        );
    `);

    await queryRunner.query(`ALTER TABLE assets ADD COLUMN "duplicateId" uuid`);

    await queryRunner.query(`ALTER TABLE asset_job_status ADD COLUMN "duplicatesDetectedAt" timestamptz`);

    await queryRunner.query(`
        ALTER TABLE assets
          ADD CONSTRAINT asset_duplicates_id
            FOREIGN KEY ("duplicateId", id)
            REFERENCES asset_duplicates DEFERRABLE INITIALLY DEFERRED
    `);

    await queryRunner.query(`
        CREATE UNIQUE INDEX "asset_duplicates_assetId_uindex"
        ON asset_duplicates ("assetId")
    `);

    await queryRunner.query(`CREATE INDEX "IDX_assets_duplicateId" ON assets ("duplicateId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE assets DROP COLUMN "duplicateId"`);
    await queryRunner.query(`DROP TABLE asset_duplicates`);
  }
}
