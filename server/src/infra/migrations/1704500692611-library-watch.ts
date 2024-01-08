import { MigrationInterface, QueryRunner } from 'typeorm';

export class LibraryWatch1704500692611 implements MigrationInterface {
  name = 'LibraryWatch1704500692611';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "libraries" ADD "isWatched" boolean NOT NULL DEFAULT false`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "libraries" DROP COLUMN "isWatched"`);
  }
}
