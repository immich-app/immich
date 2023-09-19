import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLocalDateTime1694525143117 implements MigrationInterface {
  name = 'AddLocalDateTime1694525143117';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "exif" ADD "localDateTime" TIMESTAMP`);
    await queryRunner.query(`
      update "exif"
        set "localDateTime" = "assets"."fileCreatedAt" at TIME ZONE "exif"."timeZone"
        from "assets"
      where
        "exif"."assetId" = "assets"."id" and
        "exif"."timeZone" is not null`);
    await queryRunner.query(`
      update "exif"
        set "localDateTime" = "assets"."fileCreatedAt"
        from "assets"
      where
        "exif"."assetId" = "assets"."id" and
        "exif"."timeZone" is null`);

    await queryRunner.query(`ALTER TABLE "exif" ALTER COLUMN "localDateTime" SET NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "exif" DROP COLUMN "localDateTime"`);
  }
}
