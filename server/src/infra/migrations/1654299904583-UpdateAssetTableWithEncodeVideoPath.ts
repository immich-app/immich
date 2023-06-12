import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateAssetTableWithEncodeVideoPath1654299904583 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      alter table assets
        add column if not exists "encodedVideoPath" varchar default '';
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      alter table assets
        drop column if exists "encodedVideoPath";     
      `);
  }
}
