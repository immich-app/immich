import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateOpusCodecToLibopus1694758412194 implements MigrationInterface {
  name = 'UpdateOpusCodecToLibopus1694758412194'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
                UPDATE system_config
                SET value = '"libopus"'
                WHERE key = 'ffmpeg.targetAudioCodec' AND value = '"opus"'
            `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
                UPDATE system_config
                SET value = '"opus"'
                WHERE key = 'ffmpeg.targetAudioCodec' AND value = '"libopus"'
            `);
  }
}
