import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeletedAtToAlbums1694638413248 implements MigrationInterface {
  name = 'AddDeletedAtToAlbums1694638413248';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "albums" ADD "deletedAt" TIMESTAMP WITH TIME ZONE`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "albums" DROP COLUMN "deletedAt"`);
  }
}
