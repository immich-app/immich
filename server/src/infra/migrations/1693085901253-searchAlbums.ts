import { MigrationInterface, QueryRunner } from 'typeorm';

export class SearchAlbums1693085901253 implements MigrationInterface {
  name = 'SearchAlbums1693085901253';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "searchAlbumsEnabled" boolean NOT NULL DEFAULT true`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "searchAlbumsEnabled"`);
  }
}
