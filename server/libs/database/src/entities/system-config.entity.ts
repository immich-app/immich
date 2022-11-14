import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('system_config')
export class SystemConfigEntity {
  @PrimaryColumn()
  key!: SystemConfigKey;

  @Column({ type: 'varchar', nullable: true })
  value!: SystemConfigValue;
}

export type SystemConfig = SystemConfigEntity[];

export enum SystemConfigKey {
  FFMPEG_CRF = 'ffmpeg_crf',
  FFMPEG_PRESET = 'ffmpeg_preset',
  FFMPEG_TARGET_VIDEO_CODEC = 'ffmpeg_target_video_codec',
  FFMPEG_TARGET_AUDIO_CODEC = 'ffmpeg_target_audio_codec',
  FFMPEG_TARGET_SCALING = 'ffmpeg_target_scaling',
}

export type SystemConfigValue = string | null;

export interface SystemConfigItem {
  key: SystemConfigKey;
  value: SystemConfigValue;
}
