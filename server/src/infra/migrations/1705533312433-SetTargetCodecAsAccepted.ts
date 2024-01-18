import {MigrationInterface, QueryRunner} from "typeorm"

export class SetTargetCodecAsAccepted1705533312433 implements MigrationInterface {
  name = 'SetTargetCodecAsAccepted1705533312433';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const targetVideoCodec = await queryRunner.query(`
      SELECT value
      FROM system_config
      WHERE key = 'ffmpeg.targetVideoCodec'
    `);

    if (targetVideoCodec[0] && targetVideoCodec[0].value) {
      await queryRunner.query(`
        INSERT INTO system_config (key, value)
        VALUES ('ffmpeg.acceptedVideoCodecs', '[${targetVideoCodec[0].value}]')
      `);
    }

    const targetAudioCodec = await queryRunner.query(`
      SELECT value
      FROM system_config
      WHERE key = 'ffmpeg.targetAudioCodec'
    `);

    if (targetAudioCodec[0] && targetAudioCodec[0].value) {
      await queryRunner.query(`
        INSERT INTO system_config (key, value)
        VALUES ('ffmpeg.acceptedAudioCodecs', '[${targetAudioCodec[0].value}]')
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE
      FROM system_config
      WHERE key = 'ffmpeg.acceptedVideoCodecs'
    `);

    await queryRunner.query(`
      DELETE
      FROM system_config
      WHERE key = 'ffmpeg.acceptedAudioCodecs'
    `);
  }

}
