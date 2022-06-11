import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateAssetTableWithWebpPath1653214255670 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      alter table assets
        add column if not exists "webpPath" varchar default '';
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      alter table assets
        drop column if exists "webpPath";     
      `);
  }
}
