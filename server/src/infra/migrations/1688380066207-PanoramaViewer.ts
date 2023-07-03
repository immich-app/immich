import { MigrationInterface, QueryRunner } from 'typeorm';

export class PanoramaViewer1688380066207 implements MigrationInterface {
  name = '1688379818PanoramaViewer1688380066207';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "assets" ADD "isPanorama" boolean NOT NULL DEFAULT false`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "isPanorama"`);
  }
}
