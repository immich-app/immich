import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAlbumDescription1691209138541 implements MigrationInterface {
  name = 'AddAlbumDescription1691209138541';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "albums" ADD "description" text NOT NULL DEFAULT ''`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "albums" DROP COLUMN "description"`);
  }
}
