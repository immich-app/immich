import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAlbumAssetCreatedAt1729793521993 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "albums_assets_assets" ADD COLUMN "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "albums_assets_assets" DROP COLUMN "createdAt"`);
  }
}
