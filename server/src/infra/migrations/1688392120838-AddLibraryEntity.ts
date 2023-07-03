import { MigrationInterface, QueryRunner } from 'typeorm';
import { AssetEntity, LibraryEntity, LibraryType, UserEntity } from '../entities';

export class AddLibraries1688392120838 implements MigrationInterface {
  name = 'AddLibrary1688392120838';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "assets" DROP CONSTRAINT "UQ_userid_checksum"`);
    await queryRunner.query(
      `CREATE TABLE "libraries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL DEFAULT '', "ownerId" uuid NOT NULL, "type" character varying NOT NULL, "importPaths" text array NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "refreshedAt" TIMESTAMP WITH TIME ZONE, "isVisible" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_owner_name" UNIQUE ("ownerId", "name"), CONSTRAINT "PK_505fedfcad00a09b3734b4223de" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "assets" ADD "isOffline" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "assets" ADD "libraryId" uuid NOT NULL`);
    await queryRunner.query(`ALTER TABLE "assets" DROP CONSTRAINT "UQ_4ed4f8052685ff5b1e7ca1058ba"`);
    await queryRunner.query(
      `ALTER TABLE "assets" ADD CONSTRAINT "UQ_owner_library_originalpath" UNIQUE ("ownerId", "libraryId", "originalPath")`,
    );
    await queryRunner.query(
      `ALTER TABLE "assets" ADD CONSTRAINT "UQ_owner_library_checksum" UNIQUE ("ownerId", "libraryId", "checksum")`,
    );
    await queryRunner.query(
      `ALTER TABLE "libraries" ADD CONSTRAINT "FK_0f6fc2fb195f24d19b0fb0d57c1" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "assets" ADD CONSTRAINT "FK_9977c3c1de01c3d848039a6b90c" FOREIGN KEY ("libraryId") REFERENCES "libraries"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );

    const adminUser = await queryRunner.manager.findOneOrFail(UserEntity, { where: { isAdmin: true } });
    const libraryEntity = await queryRunner.manager.save(LibraryEntity, {
      name: 'Default Library',
      owner: adminUser,
      type: LibraryType.UPLOAD,
      importPaths: [],
    });
    await queryRunner.manager.update(AssetEntity, {}, { library: libraryEntity });
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "assets" DROP CONSTRAINT "FK_9977c3c1de01c3d848039a6b90c"`);
    await queryRunner.query(`ALTER TABLE "libraries" DROP CONSTRAINT "FK_0f6fc2fb195f24d19b0fb0d57c1"`);
    await queryRunner.query(`ALTER TABLE "assets" DROP CONSTRAINT "UQ_owner_library_checksum"`);
    await queryRunner.query(`ALTER TABLE "assets" DROP CONSTRAINT "UQ_owner_library_originalpath"`);
    await queryRunner.query(
      `ALTER TABLE "assets" ADD CONSTRAINT "UQ_4ed4f8052685ff5b1e7ca1058ba" UNIQUE ("originalPath")`,
    );
    await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "libraryId"`);
    await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "isOffline"`);
    await queryRunner.query(`DROP TABLE "libraries"`);
    await queryRunner.query(`ALTER TABLE "assets" ADD CONSTRAINT "UQ_userid_checksum" UNIQUE ("ownerId", "checksum")`);
  }
}
