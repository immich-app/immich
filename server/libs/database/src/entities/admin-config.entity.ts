import { Column, Entity } from 'typeorm';

@Entity('admin_config')
export class AdminConfigEntity {
  @Column({ primary: true })
  key!: AdminConfigKey;

  @Column({ type: 'varchar', nullable: true })
  value!: string | null;
}

export enum AdminConfigKey {
  FFMPEG_CRF = 'ffmpeg_crf',
  FFMPEG_PRESET = 'ffmpeg_preset',
  FFMPEG_TARGET_VIDEO_CODEC = 'ffmpeg_target_video_codec',
  FFMPEG_TARGET_AUDIO_CODEC = 'ffmpeg_target_audio_codec',
  FFMPEG_TARGET_SCALING = 'ffmpeg_target_scaling',
}
