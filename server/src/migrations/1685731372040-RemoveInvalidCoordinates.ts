import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveInvalidCoordinates1685731372040 implements MigrationInterface {
  name = 'RemoveInvalidCoordinates1685731372040';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE "exif" SET "latitude" = NULL WHERE "latitude" IN ('NaN', 'Infinity', '-Infinity')`);
    await queryRunner.query(
      `UPDATE "exif" SET "longitude" = NULL WHERE "longitude" IN ('NaN', 'Infinity', '-Infinity')`,
    );
  }

  public async down(): Promise<void> {
    // Empty, data cannot be restored
  }
}
