import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameWebpJpegPaths1711257900274 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.renameColumn('assets', 'webpPath', 'thumbnailPath');
    await queryRunner.renameColumn('assets', 'resizePath', 'previewPath');
    await queryRunner.query(`
      UPDATE system_config
      SET key = 'image.previewSize'
      WHERE key = 'thumbnail.jpegSize'`);
    await queryRunner.query(
      `UPDATE system_config
      SET key = 'image.thumbnailSize'
      WHERE key = 'thumbnail.webpSize'`,
    );
    await queryRunner.query(
      `UPDATE system_config
      SET key = 'image.quality'
      WHERE key = 'thumbnail.quality'`,
    );
    await queryRunner.query(
      `UPDATE system_config
      SET key = 'image.colorspace'
      WHERE key = 'thumbnail.colorspace'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.renameColumn('assets', 'thumbnailPath', 'webpPath');
    await queryRunner.renameColumn('assets', 'previewPath', 'resizePath');
    await queryRunner.query(`
      UPDATE system_config
      SET key = 'thumbnail.jpegSize'
      WHERE key = 'image.previewSize'`);
    await queryRunner.query(
      `UPDATE system_config
      SET key = 'thumbnail.webpSize'
      WHERE key = 'image.thumbnailSize'`,
    );
    await queryRunner.query(
      `UPDATE system_config
      SET key = 'thumbnail.quality'
      WHERE key = 'image.quality'`,
    );
    await queryRunner.query(
      `UPDATE system_config
      SET key = 'thumbnail.colorspace'
      WHERE key = 'image.colorspace'`,
    );
  }
}
