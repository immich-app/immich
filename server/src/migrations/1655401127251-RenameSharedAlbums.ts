import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameSharedAlbums1655401127251 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE shared_albums RENAME TO albums;

      ALTER TABLE asset_shared_album RENAME TO asset_album;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE asset_album RENAME TO asset_shared_album;

      ALTER TABLE albums RENAME TO shared_albums;
    `);
  }
}
