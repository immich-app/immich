import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameSharedAlbums1655401127251 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE shared_albums RENAME TO albums
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE albums RENAME TO shared_albums
    `);
  }
}
