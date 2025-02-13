import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeletedAtColumnToAssetFacesTable1739466714036 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE asset_faces
            ADD COLUMN "deletedAt" TIMESTAMP WITH TIME ZONE DEFAULT NULL
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE asset_faces
            DROP COLUMN "deletedAt"
        `);
  }
}
