import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropNullIslandLatLong1702257380990 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'UPDATE "exif" SET latitude = NULL, longitude = NULL WHERE latitude = 0 AND longitude = 0;',
    );
  }

  public async down(): Promise<void> {
    // There's no way to know which assets used to have 0/0 lat-long if we've
    // already run this migration.
  }
}
