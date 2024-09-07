import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOriginalPathIndex1696888644031 implements MigrationInterface {
  name = 'AddOriginalPathIndex1696888644031';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE INDEX "IDX_originalPath_libraryId" ON "assets" ("originalPath", "libraryId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_originalPath_libraryId"`);
  }
}
