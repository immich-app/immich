import { CronExpression } from '@nestjs/schedule';
import {
  AudioCodec,
  Colorspace,
  CQMode,
  ImageFormat,
  LogLevel,
  OAuthTokenEndpointAuthMethod,
  QueueName,
  ToneMapping,
  TranscodeHardwareAcceleration,
  TranscodePolicy,
  VideoCodec,
  VideoContainer,
} from 'src/enum';
import { ConcurrentQueueName, FullsizeImageOptions, ImageOptions } from 'src/types';

export interface SystemConfig {
  backup: {
    database: {
      enabled: boolean;
      cronExpression: string;
      keepLastAmount: number;
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

export const defaults = Object.freeze<SystemConfig>({
  backup: {
    database: {
      enabled: true,
      cronExpression: CronExpression.EVERY_DAY_AT_2AM,
      keepLastAmount: 14,
    },
  },
  ffmpeg: {
    crf: 23,
    threads: 0,
    preset: 'ultrafast',
    targetVideoCodec: VideoCodec.H264,
    acceptedVideoCodecs: [VideoCodec.H264],
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
    [QueueName.ThumbnailGeneration]: { concurrency: 3 },
    [QueueName.VideoConversion]: { concurrency: 1 },
    [QueueName.Notification]: { concurrency: 5 },
  },
  logging: {
    enabled: true,
    level: LogLevel.Log,
  },
  machineLearning: {
    enabled: process.env.IMMICH_MACHINE_LEARNING_ENABLED !== 'false',
    urls: [process.env.IMMICH_MACHINE_LEARNING_URL || 'http://immich-machine-learning:3003'],
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
