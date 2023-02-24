import {MigrationInterface, QueryRunner} from 'typeorm';

export class RemoveVideoCodecConfigOption1674263302006 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "system_config" WHERE key = 'ffmpeg.targetVideoCodec'`);
    await queryRunner.query(`DELETE FROM "system_config" WHERE key = 'ffmpeg.targetAudioCodec'`);
  }

  public async down(): Promise<void> {
    // noop
  }
}
