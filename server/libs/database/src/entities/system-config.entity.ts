import { Column, Entity } from 'typeorm';

@Entity('admin_config')
export class SystemConfigEntity {
  @Column({ primary: true })
  key!: ConfigKey;

  @Column({ type: 'varchar', nullable: true })
  value!: string | null;
}

export enum ConfigKey {
  FFMPEG_CRF = 'ffmpeg_crf',
  FFMPEG_PRESET = 'ffmpeg_preset',
  FFMPEG_TARGET_VIDEO_CODEC = 'ffmpeg_target_video_codec',
  FFMPEG_TARGET_AUDIO_CODEC = 'ffmpeg_target_audio_codec',
  FFMEG_TARGET_SCALING = 'ffmpeg_target_scaling',
}
