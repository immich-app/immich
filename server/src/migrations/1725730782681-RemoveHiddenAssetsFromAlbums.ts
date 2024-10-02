import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveHiddenAssetsFromAlbums1725730782681 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "albums_assets_assets" WHERE "assetsId" IN (SELECT "id" FROM "assets" WHERE "isVisible" = false)`,
    );
  }

  public async down(): Promise<void> {
    // noop
  }
}
