import { ConcurrentQueueName } from 'src/interfaces/job.interface';
import { Column, Entity, PrimaryColumn } from 'typeorm';

export type SystemConfigValue = string | string[] | number | boolean;

// https://stackoverflow.com/a/47058976
// https://stackoverflow.com/a/70692231
type PathsToStringProps<T> = T extends SystemConfigValue
  ? []
  : {
      [K in keyof T]: [K, ...PathsToStringProps<T[K]>];
    }[keyof T];

type Join<T extends string[], D extends string> = T extends []
  ? never
  : T extends [infer F]
    ? F
    : T extends [infer F, ...infer R]
      ? F extends string
        ? `${F}${D}${Join<Extract<R, string[]>, D>}`
        : never
      : string;

// dot notation matches path in `SystemConfig`
// TODO: migrate to key value per section
export const SystemConfigKey = {
  FFMPEG_CRF: 'ffmpeg.crf',
  FFMPEG_THREADS: 'ffmpeg.threads',
  FFMPEG_PRESET: 'ffmpeg.preset',
  FFMPEG_TARGET_VIDEO_CODEC: 'ffmpeg.targetVideoCodec',
  FFMPEG_ACCEPTED_VIDEO_CODECS: 'ffmpeg.acceptedVideoCodecs',
  FFMPEG_TARGET_AUDIO_CODEC: 'ffmpeg.targetAudioCodec',
  FFMPEG_ACCEPTED_AUDIO_CODECS: 'ffmpeg.acceptedAudioCodecs',
  FFMPEG_TARGET_RESOLUTION: 'ffmpeg.targetResolution',
  FFMPEG_MAX_BITRATE: 'ffmpeg.maxBitrate',
  FFMPEG_BFRAMES: 'ffmpeg.bframes',
  FFMPEG_REFS: 'ffmpeg.refs',
  FFMPEG_GOP_SIZE: 'ffmpeg.gopSize',
  FFMPEG_NPL: 'ffmpeg.npl',
  FFMPEG_TEMPORAL_AQ: 'ffmpeg.temporalAQ',
  FFMPEG_CQ_MODE: 'ffmpeg.cqMode',
  FFMPEG_TWO_PASS: 'ffmpeg.twoPass',
  FFMPEG_PREFERRED_HW_DEVICE: 'ffmpeg.preferredHwDevice',
  FFMPEG_TRANSCODE: 'ffmpeg.transcode',
  FFMPEG_ACCEL: 'ffmpeg.accel',
  FFMPEG_TONEMAP: 'ffmpeg.tonemap',

  JOB_THUMBNAIL_GENERATION_CONCURRENCY: 'job.thumbnailGeneration.concurrency',
  JOB_METADATA_EXTRACTION_CONCURRENCY: 'job.metadataExtraction.concurrency',
  JOB_VIDEO_CONVERSION_CONCURRENCY: 'job.videoConversion.concurrency',
  JOB_FACE_DETECTION_CONCURRENCY: 'job.faceDetection.concurrency',
  JOB_SMART_SEARCH_CONCURRENCY = 'job.smartSearch.concurrency',
  JOB_DUPLICATE_DETECTION_CONCURRENCY = 'job.duplicateDetection.concurrency',
  JOB_BACKGROUND_TASK_CONCURRENCY: 'job.backgroundTask.concurrency',
  JOB_SEARCH_CONCURRENCY: 'job.search.concurrency',
  JOB_SIDECAR_CONCURRENCY: 'job.sidecar.concurrency',
  JOB_LIBRARY_CONCURRENCY: 'job.library.concurrency',
  JOB_MIGRATION_CONCURRENCY: 'job.migration.concurrency',

  LIBRARY_SCAN_ENABLED: 'library.scan.enabled',
  LIBRARY_SCAN_CRON_EXPRESSION: 'library.scan.cronExpression',

  LIBRARY_WATCH_ENABLED: 'library.watch.enabled',

  LOGGING_ENABLED: 'logging.enabled',
  LOGGING_LEVEL: 'logging.level',

  MACHINE_LEARNING_ENABLED: 'machineLearning.enabled',
  MACHINE_LEARNING_URL: 'machineLearning.url',

  MACHINE_LEARNING_CLIP_ENABLED: 'machineLearning.clip.enabled',
  MACHINE_LEARNING_CLIP_MODEL_NAME: 'machineLearning.clip.modelName',

  MACHINE_LEARNING_FACIAL_RECOGNITION_ENABLED: 'machineLearning.facialRecognition.enabled',
  MACHINE_LEARNING_FACIAL_RECOGNITION_MODEL_NAME: 'machineLearning.facialRecognition.modelName',
  MACHINE_LEARNING_FACIAL_RECOGNITION_MIN_SCORE: 'machineLearning.facialRecognition.minScore',
  MACHINE_LEARNING_FACIAL_RECOGNITION_MAX_DISTANCE: 'machineLearning.facialRecognition.maxDistance',
  MACHINE_LEARNING_FACIAL_RECOGNITION_MIN_FACES: 'machineLearning.facialRecognition.minFaces',

  MAP_ENABLED: 'map.enabled',
  MAP_LIGHT_STYLE: 'map.lightStyle',
  MAP_DARK_STYLE: 'map.darkStyle',

  NOTIFICATIONS_SMTP_ENABLED: 'notifications.smtp.enabled',
  NOTIFICATIONS_SMTP_FROM: 'notifications.smtp.from',
  NOTIFICATIONS_SMTP_REPLY_TO: 'notifications.smtp.replyTo',
  NOTIFICATIONS_SMTP_TRANSPORT_IGNORE_CERT: 'notifications.smtp.transport.ignoreCert',
  NOTIFICATIONS_SMTP_TRANSPORT_HOST: 'notifications.smtp.transport.host',
  NOTIFICATIONS_SMTP_TRANSPORT_PORT: 'notifications.smtp.transport.port',
  NOTIFICATIONS_SMTP_TRANSPORT_USERNAME: 'notifications.smtp.transport.username',
  NOTIFICATIONS_SMTP_TRANSPORT_PASSWORD: 'notifications.smtp.transport.password',

  REVERSE_GEOCODING_ENABLED: 'reverseGeocoding.enabled',

  NEW_VERSION_CHECK_ENABLED: 'newVersionCheck.enabled',

  OAUTH_AUTO_LAUNCH: 'oauth.autoLaunch',
  OAUTH_AUTO_REGISTER: 'oauth.autoRegister',
  OAUTH_BUTTON_TEXT: 'oauth.buttonText',
  OAUTH_CLIENT_ID: 'oauth.clientId',
  OAUTH_CLIENT_SECRET: 'oauth.clientSecret',
  OAUTH_DEFAULT_STORAGE_QUOTA: 'oauth.defaultStorageQuota',
  OAUTH_ENABLED: 'oauth.enabled',
  OAUTH_ISSUER_URL: 'oauth.issuerUrl',
  OAUTH_MOBILE_OVERRIDE_ENABLED: 'oauth.mobileOverrideEnabled',
  OAUTH_MOBILE_REDIRECT_URI: 'oauth.mobileRedirectUri',
  OAUTH_SCOPE: 'oauth.scope',
  OAUTH_SIGNING_ALGORITHM: 'oauth.signingAlgorithm',
  OAUTH_STORAGE_LABEL_CLAIM: 'oauth.storageLabelClaim',
  OAUTH_STORAGE_QUOTA_CLAIM: 'oauth.storageQuotaClaim',

  PASSWORD_LOGIN_ENABLED: 'passwordLogin.enabled',

  SERVER_EXTERNAL_DOMAIN: 'server.externalDomain',
  SERVER_LOGIN_PAGE_MESSAGE: 'server.loginPageMessage',

  STORAGE_TEMPLATE_ENABLED: 'storageTemplate.enabled',
  STORAGE_TEMPLATE_HASH_VERIFICATION_ENABLED: 'storageTemplate.hashVerificationEnabled',
  STORAGE_TEMPLATE: 'storageTemplate.template',

  IMAGE_THUMBNAIL_FORMAT: 'image.thumbnailFormat',
  IMAGE_THUMBNAIL_SIZE: 'image.thumbnailSize',
  IMAGE_PREVIEW_FORMAT: 'image.previewFormat',
  IMAGE_PREVIEW_SIZE: 'image.previewSize',
  IMAGE_QUALITY: 'image.quality',
  IMAGE_COLORSPACE: 'image.colorspace',
  IMAGE_EXTRACT_EMBEDDED: 'image.extractEmbedded',

  TRASH_ENABLED: 'trash.enabled',
  TRASH_DAYS: 'trash.days',

  THEME_CUSTOM_CSS: 'theme.customCss',

  USER_DELETE_DELAY: 'user.deleteDelay',
} as const satisfies Record<string, Join<PathsToStringProps<SystemConfig>, '.'>>;

export type SystemConfigKeyPaths = (typeof SystemConfigKey)[keyof typeof SystemConfigKey];

@Entity('system_config')
export class SystemConfigEntity<T = SystemConfigValue> {
  @PrimaryColumn({ type: 'varchar' })
  key!: SystemConfigKeyPaths;

  @Column({ type: 'varchar', nullable: true, transformer: { to: JSON.stringify, from: JSON.parse } })
  value!: T;
}

export enum TranscodePolicy {
  ALL = 'all',
  OPTIMAL = 'optimal',
  BITRATE = 'bitrate',
  REQUIRED = 'required',
  DISABLED = 'disabled',
}

export enum TranscodeTarget {
  NONE,
  AUDIO,
  VIDEO,
  ALL,
}

export enum VideoCodec {
  H264 = 'h264',
  HEVC = 'hevc',
  VP9 = 'vp9',
  AV1 = 'av1',
}

export enum AudioCodec {
  MP3 = 'mp3',
  AAC = 'aac',
  LIBOPUS = 'libopus',
}

export enum TranscodeHWAccel {
  NVENC = 'nvenc',
  QSV = 'qsv',
  VAAPI = 'vaapi',
  RKMPP = 'rkmpp',
  DISABLED = 'disabled',
}

export enum ToneMapping {
  HABLE = 'hable',
  MOBIUS = 'mobius',
  REINHARD = 'reinhard',
  DISABLED = 'disabled',
}

export enum CQMode {
  AUTO = 'auto',
  CQP = 'cqp',
  ICQ = 'icq',
}

export enum Colorspace {
  SRGB = 'srgb',
  P3 = 'p3',
}

export enum ImageFormat {
  JPEG = 'jpeg',
  WEBP = 'webp',
}

export enum LogLevel {
  VERBOSE = 'verbose',
  DEBUG = 'debug',
  LOG = 'log',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

export interface SystemConfig {
  ffmpeg: {
    crf: number;
    threads: number;
    preset: string;
    targetVideoCodec: VideoCodec;
    acceptedVideoCodecs: VideoCodec[];
    targetAudioCodec: AudioCodec;
    acceptedAudioCodecs: AudioCodec[];
    targetResolution: string;
    maxBitrate: string;
    bframes: number;
    refs: number;
    gopSize: number;
    npl: number;
    temporalAQ: boolean;
    cqMode: CQMode;
    twoPass: boolean;
    preferredHwDevice: string;
    transcode: TranscodePolicy;
    accel: TranscodeHWAccel;
    tonemap: ToneMapping;
  };
  job: Record<ConcurrentQueueName, { concurrency: number }>;
  logging: {
    enabled: boolean;
    level: LogLevel;
  };
  machineLearning: {
    enabled: boolean;
    url: string;
    clip: {
      enabled: boolean;
      modelName: string;
      duplicateThreshold: number;
    };
    facialRecognition: {
      enabled: boolean;
      modelName: string;
      minScore: number;
      minFaces: number;
      maxDistance: number;
    };
  };
  map: {
    enabled: boolean;
    lightStyle: string;
    darkStyle: string;
  };
  reverseGeocoding: {
    enabled: boolean;
  };
  oauth: {
    autoLaunch: boolean;
    autoRegister: boolean;
    buttonText: string;
    clientId: string;
    clientSecret: string;
    defaultStorageQuota: number;
    enabled: boolean;
    issuerUrl: string;
    mobileOverrideEnabled: boolean;
    mobileRedirectUri: string;
    scope: string;
    signingAlgorithm: string;
    storageLabelClaim: string;
    storageQuotaClaim: string;
  };
  passwordLogin: {
    enabled: boolean;
  };
  storageTemplate: {
    enabled: boolean;
    hashVerificationEnabled: boolean;
    template: string;
  };
  image: {
    thumbnailFormat: ImageFormat;
    thumbnailSize: number;
    previewFormat: ImageFormat;
    previewSize: number;
    quality: number;
    colorspace: Colorspace;
    extractEmbedded: boolean;
  };
  newVersionCheck: {
    enabled: boolean;
  };
  trash: {
    enabled: boolean;
    days: number;
  };
  theme: {
    customCss: string;
  };
  library: {
    scan: {
      enabled: boolean;
      cronExpression: string;
    };
    watch: {
      enabled: boolean;
    };
  };
  notifications: {
    smtp: {
      enabled: boolean;
      from: string;
      replyTo: string;
      transport: {
        ignoreCert: boolean;
        host: string;
        port: number;
        username: string;
        password: string;
      };
    };
  };
  server: {
    externalDomain: string;
    loginPageMessage: string;
  };
  user: {
    deleteDelay: number;
  };
}
