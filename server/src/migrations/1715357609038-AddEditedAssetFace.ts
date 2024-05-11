import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEditedAssetFace1715357609038 implements MigrationInterface {
  name = 'AddEditedAssetFace1715357609038';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "asset_faces" ADD "isEdited" boolean NOT NULL DEFAULT false`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "asset_faces" DROP COLUMN "isEdited"`);
  }
}
