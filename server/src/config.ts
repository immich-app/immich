import { CronExpression } from '@nestjs/schedule';
import {
  AudioCodec,
  Colorspace,
  CQMode,
  ImageFormat,
  LogLevel,
  OAuthTokenEndpointAuthMethod,
  QueueName,
  StorageBackend,
  ToneMapping,
  TranscodeHardwareAcceleration,
  TranscodePolicy,
  VideoCodec,
  VideoContainer,
} from 'src/enum';
import { ConcurrentQueueName, FullsizeImageOptions, ImageOptions } from 'src/types';

/**
 * Per-media-type S3 bucket configuration override.
 * All fields are optional - unspecified fields inherit from the default S3 config.
 */
export interface S3BucketOverride {
  endpoint?: string;
  bucket?: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  prefix?: string;
  forcePathStyle?: boolean;
  storageClass?: string;
}

export interface SystemConfig {
  backup: {
    database: {
      enabled: boolean;
      cronExpression: string;
      keepLastAmount: number;
      uploadToS3: boolean;
    };
  };
  ffmpeg: {
    crf: number;
    threads: number;
    preset: string;
    targetVideoCodec: VideoCodec;
    acceptedVideoCodecs: VideoCodec[];
    targetAudioCodec: AudioCodec;
    acceptedAudioCodecs: AudioCodec[];
    acceptedContainers: VideoContainer[];
    targetResolution: string;
    maxBitrate: string;
    bframes: number;
    refs: number;
    gopSize: number;
    temporalAQ: boolean;
    cqMode: CQMode;
    twoPass: boolean;
    preferredHwDevice: string;
    transcode: TranscodePolicy;
    accel: TranscodeHardwareAcceleration;
    accelDecode: boolean;
    tonemap: ToneMapping;
  };
  job: Record<ConcurrentQueueName, { concurrency: number }>;
  logging: {
    enabled: boolean;
    level: LogLevel;
  };
  machineLearning: {
    enabled: boolean;
    urls: string[];
    availabilityChecks: {
      enabled: boolean;
      timeout: number;
      interval: number;
    };
    clip: {
      enabled: boolean;
      modelName: string;
    };
    duplicateDetection: {
      enabled: boolean;
      maxDistance: number;
    };
    facialRecognition: {
      enabled: boolean;
      modelName: string;
      minScore: number;
      minFaces: number;
      maxDistance: number;
    };
    ocr: {
      enabled: boolean;
      modelName: string;
      minDetectionScore: number;
      minRecognitionScore: number;
      maxResolution: number;
    };
    requestTimeout: number;
    circuitBreaker: {
      failureThreshold: number;
      resetTimeout: number;
    };
    streamMode: {
      enabled: boolean;
      maxPending: number;
      resultTtlHours: number;
      maxRetries: number;
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
  metadata: {
    faces: {
      import: boolean;
    };
  };
  oauth: {
    autoLaunch: boolean;
    autoRegister: boolean;
    buttonText: string;
    clientId: string;
    clientSecret: string;
    defaultStorageQuota: number | null;
    enabled: boolean;
    issuerUrl: string;
    mobileOverrideEnabled: boolean;
    mobileRedirectUri: string;
    scope: string;
    signingAlgorithm: string;
    profileSigningAlgorithm: string;
    tokenEndpointAuthMethod: OAuthTokenEndpointAuthMethod;
    timeout: number;
    storageLabelClaim: string;
    storageQuotaClaim: string;
    roleClaim: string;
  };
  passwordLogin: {
    enabled: boolean;
  };
  storageTemplate: {
    enabled: boolean;
    hashVerificationEnabled: boolean;
    template: string;
  };
  storage: {
    backend: StorageBackend;
    s3: {
      enabled: boolean;
      endpoint: string;
      bucket: string;
      region: string;
      accessKeyId: string;
      secretAccessKey: string;
      prefix: string;
      forcePathStyle: boolean;
      storageClasses: {
        thumbnails: string;
        previews: string;
        originalsPhotos: string;
        originalsVideos: string;
        encodedVideos: string;
      };
      // Per-media-type bucket overrides (optional)
      // If specified, these override the default bucket/endpoint/credentials for that media type
      buckets: {
        originals?: S3BucketOverride;
        thumbnails?: S3BucketOverride;
        previews?: S3BucketOverride;
        encodedVideos?: S3BucketOverride;
        profile?: S3BucketOverride;
        backups?: S3BucketOverride;
      };
    };
    locations: {
      originals: StorageBackend;
      thumbnails: StorageBackend;
      previews: StorageBackend;
      encodedVideos: StorageBackend;
      profile: StorageBackend;
      backups: StorageBackend;
    };
    upload: {
      strategy: 'local-first' | 's3-first';
      deleteLocalAfterUpload: boolean;
    };
  };
  image: {
    thumbnail: ImageOptions;
    preview: ImageOptions;
    colorspace: Colorspace;
    extractEmbedded: boolean;
    fullsize: FullsizeImageOptions;
  };
  newVersionCheck: {
    enabled: boolean;
  };
  nightlyTasks: {
    startTime: string;
    databaseCleanup: boolean;
    missingThumbnails: boolean;
    clusterNewFaces: boolean;
    generateMemories: boolean;
    syncQuotaUsage: boolean;
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
        secure: boolean;
        username: string;
        password: string;
      };
    };
  };
  templates: {
    email: {
      welcomeTemplate: string;
      albumInviteTemplate: string;
      albumUpdateTemplate: string;
    };
  };
  server: {
    externalDomain: string;
    loginPageMessage: string;
    publicUsers: boolean;
  };
  user: {
    deleteDelay: number;
  };
}

export type MachineLearningConfig = SystemConfig['machineLearning'];

export const defaults = Object.freeze<SystemConfig>({
  backup: {
    database: {
      enabled: true,
      cronExpression: CronExpression.EVERY_DAY_AT_2AM,
      keepLastAmount: 14,
      uploadToS3: true,
    },
  },
  ffmpeg: {
    crf: 23,
    threads: 0,
    preset: 'ultrafast',
    targetVideoCodec: VideoCodec.H264,
    acceptedVideoCodecs: [VideoCodec.H264, VideoCodec.Hevc],
    targetAudioCodec: AudioCodec.Aac,
    acceptedAudioCodecs: [AudioCodec.Aac, AudioCodec.Mp3, AudioCodec.LibOpus],
    acceptedContainers: [VideoContainer.Mov, VideoContainer.Ogg, VideoContainer.Webm],
    targetResolution: '720',
    maxBitrate: '0',
    bframes: -1,
    refs: 0,
    gopSize: 0,
    temporalAQ: false,
    cqMode: CQMode.Auto,
    twoPass: false,
    preferredHwDevice: 'auto',
    transcode: TranscodePolicy.Required,
    tonemap: ToneMapping.Hable,
    accel: TranscodeHardwareAcceleration.Disabled,
    accelDecode: false,
  },
  job: {
    [QueueName.BackgroundTask]: { concurrency: 5 },
    [QueueName.SmartSearch]: { concurrency: 2 },
    [QueueName.MetadataExtraction]: { concurrency: 5 },
    [QueueName.FaceDetection]: { concurrency: 2 },
    [QueueName.Search]: { concurrency: 5 },
    [QueueName.Sidecar]: { concurrency: 5 },
    [QueueName.Library]: { concurrency: 5 },
    [QueueName.Migration]: { concurrency: 5 },
    [QueueName.AssetThumbnailGeneration]: { concurrency: 3 },
    [QueueName.PersonThumbnailGeneration]: { concurrency: 2 },
    [QueueName.VideoConversion]: { concurrency: 1 },
    [QueueName.Notification]: { concurrency: 5 },
    [QueueName.Ocr]: { concurrency: 1 },
    [QueueName.Workflow]: { concurrency: 5 },
    [QueueName.S3Upload]: { concurrency: 3 },
    [QueueName.Encryption]: { concurrency: 2 },
  },
  logging: {
    enabled: true,
    level: LogLevel.Log,
  },
  machineLearning: {
    enabled: process.env.IMMICH_MACHINE_LEARNING_ENABLED !== 'false',
    urls: [process.env.IMMICH_MACHINE_LEARNING_URL || 'http://immich-machine-learning:3003'],
    availabilityChecks: {
      enabled: true,
      timeout: Number(process.env.IMMICH_MACHINE_LEARNING_PING_TIMEOUT) || 2000,
      interval: 30_000,
    },
    requestTimeout: Number(process.env.IMMICH_MACHINE_LEARNING_REQUEST_TIMEOUT) || 120_000,
    circuitBreaker: {
      failureThreshold: Number(process.env.IMMICH_ML_CIRCUIT_FAILURE_THRESHOLD) || 5,
      resetTimeout: Number(process.env.IMMICH_ML_CIRCUIT_RESET_TIMEOUT) || 60_000,
    },
    clip: {
      enabled: true,
      modelName: 'ViT-B-32__openai',
    },
    duplicateDetection: {
      enabled: true,
      maxDistance: 0.01,
    },
    facialRecognition: {
      enabled: true,
      modelName: 'buffalo_l',
      minScore: 0.7,
      maxDistance: 0.5,
      minFaces: 3,
    },
    ocr: {
      enabled: true,
      modelName: 'PP-OCRv5_mobile',
      minDetectionScore: 0.5,
      minRecognitionScore: 0.8,
      maxResolution: 736,
    },
    streamMode: {
      enabled: process.env.ML_STREAM_MODE_ENABLED === 'true',
      maxPending: Number(process.env.ML_STREAM_MAX_PENDING) || 10_000,
      resultTtlHours: Number(process.env.ML_STREAM_RESULT_TTL_HOURS) || 24,
      maxRetries: Number(process.env.ML_STREAM_RETRY_MAX) || 3,
    },
  },
  map: {
    enabled: true,
    lightStyle: 'https://tiles.immich.cloud/v1/style/light.json',
    darkStyle: 'https://tiles.immich.cloud/v1/style/dark.json',
  },
  reverseGeocoding: {
    enabled: true,
  },
  metadata: {
    faces: {
      import: false,
    },
  },
  oauth: {
    autoLaunch: false,
    autoRegister: true,
    buttonText: 'Login with OAuth',
    clientId: '',
    clientSecret: '',
    defaultStorageQuota: null,
    enabled: false,
    issuerUrl: '',
    mobileOverrideEnabled: false,
    mobileRedirectUri: '',
    scope: 'openid email profile',
    signingAlgorithm: 'RS256',
    profileSigningAlgorithm: 'none',
    storageLabelClaim: 'preferred_username',
    storageQuotaClaim: 'immich_quota',
    roleClaim: 'immich_role',
    tokenEndpointAuthMethod: OAuthTokenEndpointAuthMethod.ClientSecretPost,
    timeout: 30_000,
  },
  passwordLogin: {
    enabled: true,
  },
  storageTemplate: {
    enabled: false,
    hashVerificationEnabled: true,
    template: '{{y}}/{{y}}-{{MM}}-{{dd}}/{{filename}}',
  },
  storage: {
    backend: StorageBackend.Local,
    s3: {
      enabled: false,
      endpoint: process.env.STORAGE_S3_ENDPOINT || '',
      bucket: process.env.STORAGE_S3_BUCKET || '',
      region: process.env.STORAGE_S3_REGION || 'us-east-1',
      accessKeyId: process.env.STORAGE_S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.STORAGE_S3_SECRET_ACCESS_KEY || '',
      prefix: process.env.STORAGE_S3_PREFIX || 'users/',
      forcePathStyle: true,
      storageClasses: {
        thumbnails: 'STANDARD',
        previews: 'STANDARD',
        originalsPhotos: 'GLACIER_IR',
        originalsVideos: 'GLACIER_IR',
        encodedVideos: 'STANDARD_IA', // Infrequent access - for playback
      },
      buckets: {
        // Empty by default - all media types use the default bucket config
        // Example override for cold storage originals on AWS:
        // originals: {
        //   endpoint: 'https://s3.amazonaws.com',
        //   bucket: 'my-originals-bucket',
        //   storageClass: 'GLACIER_IR',
        // },
      },
    },
    locations: {
      originals: StorageBackend.Local,
      thumbnails: StorageBackend.Local,
      previews: StorageBackend.Local,
      encodedVideos: StorageBackend.Local,
      profile: StorageBackend.Local,
      backups: StorageBackend.Local,
    },
    upload: {
      strategy: 'local-first',
      deleteLocalAfterUpload: false,
    },
  },
  image: {
    thumbnail: {
      format: ImageFormat.Webp,
      size: 250,
      quality: 80,
    },
    preview: {
      format: ImageFormat.Jpeg,
      size: 1440,
      quality: 80,
    },
    colorspace: Colorspace.P3,
    extractEmbedded: false,
    fullsize: {
      enabled: false,
      format: ImageFormat.Jpeg,
      quality: 80,
    },
  },
  newVersionCheck: {
    enabled: true,
  },
  nightlyTasks: {
    startTime: '00:00',
    databaseCleanup: true,
    generateMemories: true,
    syncQuotaUsage: true,
    missingThumbnails: true,
    clusterNewFaces: true,
  },
  trash: {
    enabled: true,
    days: 30,
  },
  theme: {
    customCss: '',
  },
  library: {
    scan: {
      enabled: true,
      cronExpression: CronExpression.EVERY_DAY_AT_MIDNIGHT,
    },
    watch: {
      enabled: false,
    },
  },
  server: {
    externalDomain: '',
    loginPageMessage: '',
    publicUsers: true,
  },
  notifications: {
    smtp: {
      enabled: false,
      from: '',
      replyTo: '',
      transport: {
        ignoreCert: false,
        host: '',
        port: 587,
        secure: false,
        username: '',
        password: '',
      },
    },
  },
  templates: {
    email: {
      welcomeTemplate: '',
      albumInviteTemplate: '',
      albumUpdateTemplate: '',
    },
  },
  user: {
    deleteDelay: 7,
  },
});
