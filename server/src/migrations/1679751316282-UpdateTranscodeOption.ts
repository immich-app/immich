import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateTranscodeOption1679751316282 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          UPDATE system_config
          SET 
            key = 'ffmpeg.transcode', 
            value = '"all"'
          WHERE 
            key = 'ffmpeg.transcodeAll' AND value = 'true'
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          UPDATE system_config
          SET 
            key = 'ffmpeg.transcodeAll',
            value = 'true'
          WHERE 
            key = 'ffmpeg.transcode' AND value = '"all"'
        `);

    await queryRunner.query(`DELETE FROM "system_config" WHERE key = 'ffmpeg.transcode'`);
  }
}
