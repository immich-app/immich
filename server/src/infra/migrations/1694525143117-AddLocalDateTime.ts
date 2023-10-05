import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLocalDateTime1694525143117 implements MigrationInterface {
  name = 'AddLocalDateTime1694525143117';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "assets" ADD "localDateTime" TIMESTAMP`);
    await queryRunner.query(`
      update "assets"
        set "localDateTime" = "fileCreatedAt"`);

    await queryRunner.query(`
      update "assets"
        set "localDateTime" = "fileCreatedAt" at TIME ZONE "exif"."timeZone"
        from "exif"
      where
        "exif"."assetId" = "assets"."id" and
        "exif"."timeZone" is not null`);

    await queryRunner.query(`ALTER TABLE "assets" ALTER COLUMN "localDateTime" SET NOT NULL`);
    await queryRunner.query(`CREATE INDEX "IDX_day_of_month" ON assets (EXTRACT(DAY FROM "localDateTime"))`);
    await queryRunner.query(`CREATE INDEX "IDX_month" ON assets (EXTRACT(MONTH FROM "localDateTime"))`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "localDateTime"`);
    await queryRunner.query(`DROP INDEX "IDX_day_of_month"`);
    await queryRunner.query(`DROP INDEX "IDX_month"`);
  }
}
