import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOriginalFileNameToAssetTable1681144628393 implements MigrationInterface {
  name = 'AddOriginalFileNameToAssetTable1681144628393';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "assets" ADD "originalFileName" character varying`);

    await queryRunner.query(`
    UPDATE assets a
      SET "originalFileName" = (
        select e."imageName"
        from exif e
        where e."assetId" = a.id
      )
    `);

    await queryRunner.query(`
    UPDATE assets a
      SET "originalFileName" = a.id
      where a."originalFileName" IS NULL or a."originalFileName" = ''
    `);

    await queryRunner.query(`ALTER TABLE "assets" ALTER COLUMN "originalFileName" SET NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "originalFileName"`);
  }
}
