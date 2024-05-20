import { MigrationInterface, QueryRunner } from 'typeorm';

export class MotionAssetExtensionMP41715435221124 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "assets" SET "originalFileName" = regexp_replace("originalFileName", '\\.[a-zA-Z0-9]+$', '.mp4') WHERE "originalPath" LIKE '%.mp4' AND "isVisible" = false`,
    );
  }

  public async down(): Promise<void> {}
}
