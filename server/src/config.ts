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
    autoStack: {
      enabled: boolean;
      windowSeconds: number; // time window around new asset for candidate grouping
      maxGapSeconds: number; // max allowed gap between sequential assets inside a group
      extendedWindowSeconds?: number; // optional wider temporal window for secondary grouping/merging
      relaxedGapMultiplier?: number; // multiplier applied to maxGapSeconds when forming secondary/merged groups
      minGroupSize: number; // minimum assets required to store a candidate
      horizonMinutes: number; // backfill look-back horizon for scheduled generation
      cameraMatch: boolean; // require same make+model when available
      maxCandidates: number; // maximum active candidate groups per user (older/low score pruned)
      autoPromoteMinScore: number; // if >0 and group score >= value, auto-promote immediately
      weights: { size: number; timeSpan: number; continuity: number; visual: number; exposure: number };
      visualPromoteThreshold: number;
      // New enhancement keys (phase: merging & bridging)
      maxMergeGapSeconds?: number; // if two groups separated by <= this temporal gap, attempt merge
      visualBridgeThreshold?: number; // raw cosine (0..1); if exceeded between boundary assets, allow continuity despite gap
      mergeScoreDelta?: number; // minimum score improvement required to keep merged group (default 0 = always merge)
      // Outlier pruning (remove assets whose removal improves avg visual similarity by at least this delta)
      outlierPruneEnabled?: boolean;
      outlierPruneMinDelta?: number; // 0..1 delta improvement threshold
      outlierPruneIterative?: boolean; // iterate pruning until no further improvement
      // pHash historical backfill
      pHashBackfillEnabled?: boolean;
      pHashBackfillBatchSize?: number;
      // Candidate aging / cleanup
      candidateAgingDays?: number; // dismiss after N days
      candidateAgingScoreThreshold?: number; // only dismiss if below this score
      // Google-Photos-like enhancements
      secondaryVisualWindowSeconds?: number; // extend search radius to pull in visually near-identical shots just outside window
      visualGroupSimilarityThreshold?: number; // cosine threshold for adding external assets into an existing group
      pHashHammingThreshold?: number; // maximum pHash Hamming distance to consider near-duplicate
      overlapMergeEnabled?: boolean; // merge overlapping / intersecting groups into unified stack
      bestPrimaryHeuristic?: boolean; // choose best primary (sharpest / lowest ISO / shortest exposure)
      secondaryVisualMaxAdds?: number; // cap number of visually expanded assets per group
      mlOffloadEnabled?: boolean; // offload heavy scoring steps to ML service when available
      // Session segmentation
      sessionMaxSpanSeconds?: number;
      sessionMinAvgAdjacency?: number;
      sessionMinSegmentSize?: number;
      // Hysteresis (flattened)
      hysteresisEnabled?: boolean;
      hysteresisCandidateWindowMinutes?: number;
      hysteresisMaxCandidates?: number;
      hysteresisRaiseScoreBy?: number;
    };
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
    [QueueName.AutoStackCandidateQueueAll]: { concurrency: 1 },
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
    [QueueName.Ocr]: { concurrency: 1 },
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
    autoStack: {
      enabled: true,
      // Google-Photos-aligned defaults: tighter temporal windows, stronger visual weighting
      windowSeconds: 90, // total bi-directional scan window (was 180)
      maxGapSeconds: 30, // max allowed gap inside a burst (was 180)
      extendedWindowSeconds: 150, // secondary visual expansion search radius (was 180)
      relaxedGapMultiplier: 1.5, // allow modest relaxation during secondary grouping (was 1)
      minGroupSize: 2,
      horizonMinutes: 10,
      cameraMatch: true,
      maxCandidates: 200,
      autoPromoteMinScore: 70, // require higher overall score before auto-promotion (was 35)
      weights: {
        size: 30, // de-emphasize raw count (was 50)
        timeSpan: 20,
        continuity: 20, // emphasize sequential capture (was 10)
        visual: 50, // emphasize visual similarity (was 15)
        exposure: 10, // include exposure consistency (was 10)
      },
      visualPromoteThreshold: 0.65, // require stronger visual cohesion (was 0.65)
      maxMergeGapSeconds: 120, // only merge groups very close in time (was 60)
      visualBridgeThreshold: 0.70, // need higher bridge similarity (was 0.55)
      mergeScoreDelta: 0,
      // Outlier pruning: remove assets that hurt cohesion (avg visual similarity) beyond threshold
      outlierPruneEnabled: true,
      outlierPruneMinDelta: 0.2, // increased from 0.04 to make pruning less aggressive (require larger visual gain)
      outlierPruneIterative: true, 
      // pHash historical backfill control
      pHashBackfillEnabled: true,
      pHashBackfillBatchSize: 500,
      // Candidate aging (cleanup)
      candidateAgingDays: 14,
      candidateAgingScoreThreshold: 25,
      overlapMergeEnabled: true,
      bestPrimaryHeuristic: true,
      secondaryVisualMaxAdds: 20, // allow more visual expansion per group (was 3)
      mlOffloadEnabled: false,
      // Session segmentation defaults
      sessionMaxSpanSeconds: 300, // 5 minutes
      sessionMinAvgAdjacency: 0.65, // require moderate visual cohesion to keep long span
      sessionMinSegmentSize: 2,
      // Hysteresis (legacy compat; keep old structure mapping onto new flat fields)
      hysteresisEnabled: true,
      hysteresisCandidateWindowMinutes: 30,
      hysteresisMaxCandidates: 200,
      hysteresisRaiseScoreBy: 10,
  // Jobs: AutoStack now queues background jobs (AutoStackCandidateGenerateForAsset) on metadata extraction
  // Debounce: per-user auto stack job queueing has an in-memory 5s debounce to coalesce rapid imports
    },
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
