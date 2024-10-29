import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveLibraryType1715804005643 implements MigrationInterface {
  name = 'RemoveLibraryType1715804005643';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "assets" DROP CONSTRAINT "FK_9977c3c1de01c3d848039a6b90c"`);
    await queryRunner.query(`DROP INDEX "UQ_assets_owner_library_checksum"`);
    await queryRunner.query(`DROP INDEX "IDX_originalPath_libraryId"`);
    await queryRunner.query(`ALTER TABLE "assets" ALTER COLUMN "libraryId" DROP NOT NULL`);
    await queryRunner.query(`
      UPDATE "assets"
      SET "libraryId" = NULL
      FROM "libraries"
      WHERE "assets"."libraryId" = "libraries"."id"
      AND "libraries"."type" = 'UPLOAD'
`);
    await queryRunner.query(`DELETE FROM "libraries" WHERE "type" = 'UPLOAD'`);
    await queryRunner.query(`ALTER TABLE "libraries" DROP COLUMN "type"`);
    await queryRunner.query(`CREATE INDEX "IDX_originalPath_libraryId" ON "assets" ("originalPath", "libraryId")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_assets_owner_checksum" ON "assets" ("ownerId", "checksum") WHERE "libraryId" IS NULL`);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_assets_owner_library_checksum" ON "assets" ("ownerId", "libraryId", "checksum") WHERE "libraryId" IS NOT NULL`);
    await queryRunner.query(`ALTER TABLE "assets" ADD CONSTRAINT "FK_9977c3c1de01c3d848039a6b90c" FOREIGN KEY ("libraryId") REFERENCES "libraries"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
  }

  public async down(): Promise<void> {
    // not implemented
  }
}
