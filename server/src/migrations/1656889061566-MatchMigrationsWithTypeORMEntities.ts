import { MigrationInterface, QueryRunner } from 'typeorm';

export class MatchMigrationsWithTypeORMEntities1656889061566 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "exif" ADD "exifTextSearchableColumn" tsvector GENERATED ALWAYS AS (TO_TSVECTOR('english',
                         COALESCE(make, '') || ' ' ||
                         COALESCE(model, '') || ' ' ||
                         COALESCE(orientation, '') || ' ' ||
                         COALESCE("lensModel", '') || ' ' ||
                         COALESCE("city", '') || ' ' ||
                         COALESCE("state", '') || ' ' ||
                         COALESCE("country", ''))) STORED`);
    await queryRunner.query(`ALTER TABLE "exif" ALTER COLUMN "exifTextSearchableColumn" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "firstName" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "lastName" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "isAdmin" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "profileImagePath" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "shouldChangePassword" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "asset_album" DROP CONSTRAINT "FK_a8b79a84996cef6ba6a3662825d"`);
    await queryRunner.query(`ALTER TABLE "asset_album" DROP CONSTRAINT "FK_64f2e7d68d1d1d8417acc844a4a"`);
    await queryRunner.query(`ALTER TABLE "asset_album" DROP CONSTRAINT "UQ_a1e2734a1ce361e7a26f6b28288"`);
    await queryRunner.query(
      `ALTER TABLE "asset_album" ADD CONSTRAINT "UQ_unique_asset_in_album" UNIQUE ("albumId", "assetId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_album" ADD CONSTRAINT "FK_256a30a03a4a0aff0394051397d" FOREIGN KEY ("albumId") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_album" ADD CONSTRAINT "FK_7ae4e03729895bf87e056d7b598" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "shouldChangePassword" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "profileImagePath" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "isAdmin" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "lastName" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "firstName" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "exif" DROP COLUMN "exifTextSearchableColumn"`);
    await queryRunner.query(`ALTER TABLE "asset_album" DROP CONSTRAINT "FK_7ae4e03729895bf87e056d7b598"`);
    await queryRunner.query(`ALTER TABLE "asset_album" DROP CONSTRAINT "FK_256a30a03a4a0aff0394051397d"`);
    await queryRunner.query(`ALTER TABLE "asset_album" DROP CONSTRAINT "UQ_unique_asset_in_album"`);
    await queryRunner.query(
      `ALTER TABLE "asset_album" ADD CONSTRAINT "UQ_a1e2734a1ce361e7a26f6b28288" UNIQUE ("albumId", "assetId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_album" ADD CONSTRAINT "FK_64f2e7d68d1d1d8417acc844a4a" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "asset_album" ADD CONSTRAINT "FK_a8b79a84996cef6ba6a3662825d" FOREIGN KEY ("albumId") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
