import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('system_config')
export class SystemConfigEntity {
  @PrimaryColumn()
  key!: SystemConfigKey;

  @Column({ type: 'varchar', nullable: true, transformer: { to: JSON.stringify, from: JSON.parse } })
  value!: SystemConfigValue;
}

export enum SystemConfigKey {
  FFMPEG = 'ffmpeg',
  OAUTH = 'oauth',
}

export interface OAuthConfig {
  enabled: boolean;
  issuerUrl: string;
  clientId: string;
  clientSecret: string;
  scope: string;
  buttonText: string;
  autoRegister: boolean;
}

export interface FFmpegConfig {
  crf: string;
  preset: string;
  targetVideoCodec: string;
  targetAudioCodec: string;
  targetScaling: string;
}

export type SystemConfigValue = OAuthConfig | FFmpegConfig;
