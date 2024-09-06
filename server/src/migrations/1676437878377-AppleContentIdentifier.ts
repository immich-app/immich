import { MigrationInterface, QueryRunner } from 'typeorm';

export class AppleContentIdentifier1676437878377 implements MigrationInterface {
  name = 'AppleContentIdentifier1676437878377';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "exif" ADD "livePhotoCID" character varying`);
    await queryRunner.query(`CREATE INDEX "IDX_live_photo_cid" ON "exif" ("livePhotoCID") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_live_photo_cid"`);
    await queryRunner.query(`ALTER TABLE "exif" DROP COLUMN "livePhotoCID"`);
  }
}
