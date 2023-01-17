import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMorePermissionToSharedLink1673907194740 implements MigrationInterface {
  name = 'AddMorePermissionToSharedLink1673907194740';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "shared_links" ADD "allowDownload" boolean NOT NULL DEFAULT true`);
    await queryRunner.query(`ALTER TABLE "shared_links" ADD "showExif" boolean NOT NULL DEFAULT true`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "shared_links" DROP COLUMN "showExif"`);
    await queryRunner.query(`ALTER TABLE "shared_links" DROP COLUMN "allowDownload"`);
  }
}
