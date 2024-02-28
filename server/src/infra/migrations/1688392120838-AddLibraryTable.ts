import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLibraries1688392120838 implements MigrationInterface {
  name = 'AddLibraryTable1688392120838';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "assets" DROP CONSTRAINT "UQ_userid_checksum"`);
    await queryRunner.query(
      `CREATE TABLE "libraries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "ownerId" uuid NOT NULL, "type" character varying NOT NULL, "importPaths" text array NOT NULL, "exclusionPatterns" text array NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "refreshedAt" TIMESTAMP WITH TIME ZONE, "isVisible" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_505fedfcad00a09b3734b4223de" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "assets" ADD "isOffline" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "assets" ADD "libraryId" uuid`);
    await queryRunner.query(`ALTER TABLE "assets" DROP CONSTRAINT "UQ_4ed4f8052685ff5b1e7ca1058ba"`);
    await queryRunner.query(`ALTER TABLE "assets" ADD "isExternal" boolean NOT NULL DEFAULT false`);

    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_assets_owner_library_checksum" on "assets" ("ownerId", "libraryId", checksum)`,
    );
    await queryRunner.query(
      `ALTER TABLE "libraries" ADD CONSTRAINT "FK_0f6fc2fb195f24d19b0fb0d57c1" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "assets" ADD CONSTRAINT "FK_9977c3c1de01c3d848039a6b90c" FOREIGN KEY ("libraryId") REFERENCES "libraries"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );

    // Create default library for each user and assign all assets to it
    const users = await queryRunner.query(`SELECT id FROM "users"`);
    const userIds: string[] = users.map((user: any) => user.id);

    for (const userId of userIds) {
      await queryRunner.query(
        `INSERT INTO "libraries" ("name", "ownerId", "type", "importPaths", "exclusionPatterns") VALUES ('Default Library', '${userId}', 'UPLOAD', '{}', '{}')`,
      );

      await queryRunner.query(
        `UPDATE "assets" SET "libraryId" = (SELECT id FROM "libraries" WHERE "ownerId" = '${userId}' LIMIT 1) WHERE "ownerId" = '${userId}'`,
      );
    }

    await queryRunner.query(`ALTER TABLE "assets" ALTER COLUMN "libraryId" SET NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "assets" ALTER COLUMN "libraryId" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "assets" DROP CONSTRAINT "FK_9977c3c1de01c3d848039a6b90c"`);
    await queryRunner.query(`ALTER TABLE "libraries" DROP CONSTRAINT "FK_0f6fc2fb195f24d19b0fb0d57c1"`);
    await queryRunner.query(`DROP INDEX "UQ_assets_owner_library_checksum"`);
    await queryRunner.query(`ALTER TABLE "assets" DROP CONSTRAINT "UQ_owner_library_originalpath"`);
    await queryRunner.query(
      `ALTER TABLE "assets" ADD CONSTRAINT "UQ_4ed4f8052685ff5b1e7ca1058ba" UNIQUE ("originalPath")`,
    );
    await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "libraryId"`);
    await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "isOffline"`);
    await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "isExternal"`);
    await queryRunner.query(`DROP TABLE "libraries"`);
    await queryRunner.query(`ALTER TABLE "assets" ADD CONSTRAINT "UQ_userid_checksum" UNIQUE ("ownerId", "checksum")`);
  }
}
