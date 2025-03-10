import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExifUpdateId1741281344519 implements MigrationInterface {
  name = 'AddExifUpdateId1741281344519';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "exif" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT clock_timestamp()`,
    );
    await queryRunner.query(`ALTER TABLE "exif" ADD "updateId" uuid NOT NULL DEFAULT immich_uuid_v7()`);
    await queryRunner.query(`CREATE INDEX "IDX_asset_exif_update_id" ON "exif" ("updateId") `);
    await queryRunner.query(`
        create trigger asset_exif_updated_at
        before update on exif
        for each row execute procedure updated_at()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_asset_exif_update_id"`);
    await queryRunner.query(`ALTER TABLE "exif" DROP COLUMN "updateId"`);
    await queryRunner.query(`ALTER TABLE "exif" DROP COLUMN "updatedAt"`);
    await queryRunner.query(`DROP TRIGGER asset_exif_updated_at on exif`);
  }
}
