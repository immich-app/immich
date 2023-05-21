import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('system_config')
export class SystemConfigEntity<T = string | boolean | number> {
  @PrimaryColumn()
  key!: SystemConfigKey;

  @Column({ type: 'varchar', nullable: true, transformer: { to: JSON.stringify, from: JSON.parse } })
  value!: T;
}

export type SystemConfigValue = any;

// dot notation matches path in `SystemConfig`
export enum SystemConfigKey {
  FFMPEG_CRF = 'ffmpeg.crf',
  FFMPEG_THREADS = 'ffmpeg.threads',
  FFMPEG_PRESET = 'ffmpeg.preset',
  FFMPEG_TARGET_VIDEO_CODEC = 'ffmpeg.targetVideoCodec',
  FFMPEG_TARGET_AUDIO_CODEC = 'ffmpeg.targetAudioCodec',
  FFMPEG_TARGET_RESOLUTION = 'ffmpeg.targetResolution',
  FFMPEG_MAX_BITRATE = 'ffmpeg.maxBitrate',
  FFMPEG_TWO_PASS = 'ffmpeg.twoPass',
  FFMPEG_TRANSCODE = 'ffmpeg.transcode',
  OAUTH_ENABLED = 'oauth.enabled',
  OAUTH_ISSUER_URL = 'oauth.issuerUrl',
  OAUTH_CLIENT_ID = 'oauth.clientId',
  OAUTH_CLIENT_SECRET = 'oauth.clientSecret',
  OAUTH_SCOPE = 'oauth.scope',
  OAUTH_AUTO_LAUNCH = 'oauth.autoLaunch',
  OAUTH_BUTTON_TEXT = 'oauth.buttonText',
  OAUTH_AUTO_REGISTER = 'oauth.autoRegister',
  OAUTH_MOBILE_OVERRIDE_ENABLED = 'oauth.mobileOverrideEnabled',
  OAUTH_MOBILE_REDIRECT_URI = 'oauth.mobileRedirectUri',
  PASSWORD_LOGIN_ENABLED = 'passwordLogin.enabled',
  STORAGE_TEMPLATE = 'storageTemplate.template',
}

export enum TranscodePreset {
  ALL = 'all',
  OPTIMAL = 'optimal',
  REQUIRED = 'required',
  DISABLED = 'disabled',
}

export interface SystemConfig {
  ffmpeg: {
    crf: number;
    threads: number;
    preset: string;
    targetVideoCodec: string;
    targetAudioCodec: string;
    targetResolution: string;
    maxBitrate: string;
    twoPass: boolean;
    transcode: TranscodePreset;
  };
  oauth: {
    enabled: boolean;
    issuerUrl: string;
    clientId: string;
    clientSecret: string;
    scope: string;
    buttonText: string;
    autoRegister: boolean;
    autoLaunch: boolean;
    mobileOverrideEnabled: boolean;
    mobileRedirectUri: string;
  };
  passwordLogin: {
    enabled: boolean;
  };
  storageTemplate: {
    template: string;
  };
}
