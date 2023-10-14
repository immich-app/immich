import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSkipMotionPhotoToAsset1697298130109 implements MigrationInterface {
  name = 'AddSkipMotionPhotoToAsset1697298130109';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "assets" ADD "isSkipMotion" boolean NOT NULL DEFAULT false`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "isSkipMotion"`);
  }
}
