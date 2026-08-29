import { CronExpression } from '@nestjs/schedule';
import { validateCronExpression } from 'cron';
import { createZodDto } from 'nestjs-zod';
import {
  AudioCodec,
  AudioCodecSchema,
  Colorspace,
  ColorspaceSchema,
  ConfigVisibility,
  CQMode,
  CQModeSchema,
  HlsVideoResolution,
  HlsVideoResolutionSchema,
  ImageFormat,
  ImageFormatSchema,
  LogLevel,
  LogLevelSchema,
  OAuthTokenEndpointAuthMethod,
  OAuthTokenEndpointAuthMethodSchema,
  ReleaseChannel,
  ReleaseChannelSchema,
  ToneMapping,
  ToneMappingSchema,
  TranscodeHardwareAcceleration,
  TranscodeHardwareAccelerationSchema,
  TranscodePolicy,
  TranscodePolicySchema,
  VideoCodec,
  VideoCodecSchema,
  VideoContainer,
  VideoContainerSchema,
} from 'src/enum';
import { DeepPartial } from 'src/types';
import z from 'zod';

const { Admin, User, Public } = ConfigVisibility;

const configBool = z
  .preprocess(
    (val) => z.stringbool({ truthy: ['true'], falsy: ['false'], case: 'sensitive' }).safeParse(val).data ?? val,
    z.boolean(),
  )

  .nonoptional()
  .meta({ type: 'boolean' });

const cronExpressionSchema = z
  .string()
  .superRefine((value, ctx) => {
    const validated = validateCronExpression(value);
    if (!validated.valid) {
      ctx.addIssue({
        code: 'custom',
        message: `Invalid cron expression. ${validated.error?.message ?? ''}`,
        input: value,
      });
    }
  })
  .describe('Cron expression');

const emptyOrUrl = (error: string) =>
  z.string().refine((url) => url.length === 0 || z.url().safeParse(url).success, { error });

const AdminConfigIntegrityJobSchema = z
  .object({
    enabled: z.boolean().describe('Enabled'),
    cronExpression: cronExpressionSchema.describe('Cron expression for when the integrity check should run'),
  })
  .describe('Integrity job config')
  .meta({ id: 'AdminConfigIntegrityJobDto' });

const AdminConfigJobSettingsSchema = z
  .object({ concurrency: z.int().min(1).describe('Concurrency') })
  .meta({ id: 'AdminConfigJobSettingsDto' });

const AdminConfigMachineLearningTaskSchema = z.object({
  enabled: z.boolean().describe('Whether the task is enabled').meta({ visibility: User }),
});

const AdminConfigMachineLearningModelSchema = AdminConfigMachineLearningTaskSchema.extend({
  modelName: z.string().describe('Name of the model to use'),
});

const AdminConfigGeneratedImageSchema = z
  .object({
    format: ImageFormatSchema,
    quality: z.int().min(1).max(100).describe('Quality'),
    size: z.int().min(1).describe('Size').meta({ visibility: User }),
    progressive: configBool.default(false).optional().describe('Progressive'),
  })
  .meta({ id: 'AdminConfigGeneratedImageDto' });

const AdminConfigFFmpegSchema = z
  .object({
    crf: z.coerce.number().int().min(0).max(51).describe('CRF'),
    threads: z.coerce.number().int().min(0).describe('Threads'),
    preset: z.string().describe('Preset'),
    targetVideoCodec: VideoCodecSchema,
    acceptedVideoCodecs: z.array(VideoCodecSchema).describe('Accepted video codecs'),
    targetAudioCodec: AudioCodecSchema,
    acceptedAudioCodecs: z.array(AudioCodecSchema).describe('Accepted audio codecs'),
    acceptedContainers: z.array(VideoContainerSchema).describe('Accepted containers'),
    targetResolution: z.string().describe('Target resolution'),
    maxBitrate: z.string().describe('Max bitrate'),
    bframes: z.coerce.number().int().min(-1).max(16).describe('B-frames'),
    refs: z.coerce.number().int().min(0).max(6).describe('References'),
    gopSize: z.coerce.number().int().min(0).describe('GOP size'),
    temporalAQ: configBool.describe('Temporal AQ'),
    cqMode: CQModeSchema,
    twoPass: configBool.describe('Two pass'),
    preferredHwDevice: z.string().describe('Preferred hardware device'),
    transcode: TranscodePolicySchema,
    accel: TranscodeHardwareAccelerationSchema,
    accelDecode: configBool.describe('Accelerated decode'),
    tonemap: ToneMappingSchema,
    realtime: z
      .object({
        enabled: configBool.describe('Enable real-time HLS transcoding (alpha)').meta({ visibility: User }),
        videoCodecs: z
          .array(VideoCodecSchema)
          .describe('Video codecs to use for real-time HLS transcoding')
          .meta({ visibility: User }),
        resolutions: z
          .array(HlsVideoResolutionSchema)
          .describe('Resolutions to use for real-time HLS transcoding')
          .meta({ visibility: User }),
      })
      .meta({ id: 'AdminConfigFFmpegRealtimeDto' }),
  })
  .meta({ id: 'AdminConfigFFmpegDto' });

const AdminConfigSmtpSchema = z
  .object({
    enabled: configBool.describe('Whether SMTP email notifications are enabled'),
    from: z.string().describe('Email address to send from'),
    replyTo: z.string().describe('Email address for replies'),
    transport: z
      .object({
        ignoreCert: configBool.describe('Whether to ignore SSL certificate errors'),
        host: z.string().describe('SMTP server hostname'),
        port: z.int().min(0).max(65_535).describe('SMTP server port'),
        secure: configBool.describe('Whether to use secure connection (TLS/SSL)'),
        username: z.string().describe('SMTP username'),
        password: z.string().describe('SMTP password'),
      })
      .meta({ id: 'AdminConfigSmtpTransportDto' }),
  })
  .meta({ id: 'AdminConfigSmtpDto' });

const AdminConfigSchemaWithVisibility = z
  .object({
    backup: z
      .object({
        database: z
          .object({
            enabled: configBool.describe('Enabled'),
            cronExpression: cronExpressionSchema,
            keepLastAmount: z.int().min(1).describe('Keep last amount'),
          })
          .meta({ id: 'AdminConfigDatabaseBackupDto' }),
      })
      .meta({ id: 'AdminConfigBackupsDto' }),
    ffmpeg: AdminConfigFFmpegSchema,
    integrityChecks: z
      .object({
        missingFiles: AdminConfigIntegrityJobSchema,
        untrackedFiles: AdminConfigIntegrityJobSchema,
        checksumFiles: AdminConfigIntegrityJobSchema.extend({
          timeLimit: z.int().nonnegative().describe('How long the integrity checksum job may run for'),
          percentageLimit: z
            .float32()
            .nonnegative()
            .max(1)
            .describe('Percentage limit of the integrity checksum job')
            .meta({ format: 'double' }),
        })
          .describe('Integrity checksum job config')
          .meta({ id: 'AdminConfigIntegrityChecksumJobDto' }),
      })
      .describe('Integrity checks config')
      .meta({ id: 'AdminConfigIntegrityChecksDto' }),
    job: z
      .object({
        thumbnailGeneration: AdminConfigJobSettingsSchema,
        metadataExtraction: AdminConfigJobSettingsSchema,
        videoConversion: AdminConfigJobSettingsSchema,
        faceDetection: AdminConfigJobSettingsSchema,
        smartSearch: AdminConfigJobSettingsSchema,
        backgroundTask: AdminConfigJobSettingsSchema,
        migration: AdminConfigJobSettingsSchema,
        search: AdminConfigJobSettingsSchema,
        sidecar: AdminConfigJobSettingsSchema,
        library: AdminConfigJobSettingsSchema,
        notifications: AdminConfigJobSettingsSchema,
        ocr: AdminConfigJobSettingsSchema,
        workflow: AdminConfigJobSettingsSchema,
        editor: AdminConfigJobSettingsSchema,
        integrityCheck: AdminConfigJobSettingsSchema,
      })
      .meta({ id: 'AdminConfigJobDto' }),
    logging: z
      .object({
        enabled: configBool.describe('Enabled'),
        level: LogLevelSchema,
      })
      .meta({ id: 'AdminConfigLoggingDto' }),
    machineLearning: z
      .object({
        enabled: configBool.describe('Enabled').meta({ visibility: User }),
        urls: z.array(z.string()).min(1).describe('ML service URLs'),
        availabilityChecks: z
          .object({
            enabled: configBool.describe('Enabled'),
            timeout: z.int(),
            interval: z.int(),
          })
          .meta({ id: 'AdminConfigMachineLearningAvailabilityChecksDto' }),
        clip: AdminConfigMachineLearningModelSchema.meta({ id: 'AdminConfigClipDto' }),
        duplicateDetection: AdminConfigMachineLearningTaskSchema.extend({
          maxDistance: z
            .number()
            .min(0.001)
            .max(0.1)
            .describe('Maximum distance threshold for duplicate detection')
            .meta({ format: 'double' }),
        }).meta({ id: 'AdminConfigDuplicateDetectionDto' }),
        facialRecognition: AdminConfigMachineLearningModelSchema.extend({
          minScore: z
            .number()
            .min(0.1)
            .max(1)
            .describe('Minimum confidence score for face detection')
            .meta({ format: 'double' }),
          maxDistance: z
            .number()
            .min(0.1)
            .max(2)
            .describe('Maximum distance threshold for face recognition')
            .meta({ format: 'double' }),
          minFaces: z
            .int()
            .min(1)
            .describe('Minimum number of faces required for recognition')
            .meta({ visibility: User }),
        }).meta({ id: 'AdminConfigFacialRecognitionDto' }),
        ocr: AdminConfigMachineLearningModelSchema.extend({
          maxResolution: z.int().min(1).describe('Maximum resolution for OCR processing'),
          minDetectionScore: z
            .number()
            .min(0.1)
            .max(1)
            .describe('Minimum confidence score for text detection')
            .meta({ format: 'double' }),
          minRecognitionScore: z
            .number()
            .min(0.1)
            .max(1)
            .describe('Minimum confidence score for text recognition')
            .meta({ format: 'double' }),
        }).meta({ id: 'AdminConfigOcrDto' }),
      })
      .meta({ id: 'AdminConfigMachineLearningDto' }),
    map: z
      .object({
        enabled: configBool.describe('Enabled').meta({ visibility: User }),
        lightStyle: z.url().describe('Light map style URL').meta({ visibility: User }),
        darkStyle: z.url().describe('Dark map style URL').meta({ visibility: User }),
      })
      .meta({ id: 'AdminConfigMapDto' }),
    reverseGeocoding: z
      .object({ enabled: configBool.describe('Enabled').meta({ visibility: User }) })
      .meta({ id: 'AdminConfigReverseGeocodingDto' }),
    metadata: z
      .object({
        faces: z.object({ import: configBool.describe('Import') }).meta({ id: 'AdminConfigFacesDto' }),
      })
      .meta({ id: 'AdminConfigMetadataDto' }),
    oauth: z
      .object({
        autoLaunch: configBool.describe('Auto launch').meta({ visibility: Public }),
        autoRegister: configBool.describe('Auto register'),
        buttonText: z.string().describe('Button text').meta({ visibility: Public }),
        clientId: z.string().describe('Client ID'),
        clientSecret: z.string().describe('Client secret'),
        tokenEndpointAuthMethod: OAuthTokenEndpointAuthMethodSchema,
        timeout: z.int().min(1).describe('Timeout'),
        allowInsecureRequests: configBool.describe('Allow insecure requests'),
        defaultStorageQuota: z.int().min(0).nullable().describe('Default storage quota'),
        enabled: configBool.describe('Enabled').meta({ visibility: Public }),
        issuerUrl: emptyOrUrl('Issuer URL must be an empty string or a valid URL').describe('Issuer URL'),
        accountManagementUrl: emptyOrUrl('Account management URL must be an empty string or a valid URL')
          .describe('Account management URL')
          .optional()
          .default(''),
        scope: z.string().describe('Scope'),
        prompt: z.string().describe('OAuth prompt parameter (e.g. select_account, login, consent)'),
        endSessionEndpoint: emptyOrUrl('endSessionEndpoint must be an empty string or a valid URL').describe(
          'End session endpoint',
        ),
        signingAlgorithm: z.string().describe('Signing algorithm'),
        profileSigningAlgorithm: z.string().describe('Profile signing algorithm'),
        storageLabelClaim: z.string().describe('Storage label claim'),
        storageQuotaClaim: z.string().describe('Storage quota claim'),
        roleClaim: z.string().describe('Role claim'),
        mobileOverrideEnabled: configBool.describe('Mobile override enabled'),
        mobileRedirectUri: z.string().describe('Mobile redirect URI (set to empty string to disable)'),
      })
      .transform((value, ctx) => {
        if (!value.mobileOverrideEnabled || value.mobileRedirectUri === '') {
          return value;
        }

        if (!z.url().safeParse(value.mobileRedirectUri).success) {
          ctx.issues.push({
            code: 'custom',
            message: 'Mobile redirect URI must be an empty string or a valid URL',
            input: value.mobileRedirectUri,
          });
          return z.NEVER;
        }

        return value;
      })
      .meta({ id: 'AdminConfigOAuthDto' }),
    passwordLogin: z
      .object({ enabled: configBool.describe('Enabled').meta({ visibility: Public }) })
      .meta({ id: 'AdminConfigPasswordLoginDto' }),
    storageTemplate: z
      .object({
        enabled: configBool.describe('Enabled'),
        hashVerificationEnabled: configBool.describe('Hash verification enabled'),
        template: z.string().describe('Template'),
      })
      .meta({ id: 'AdminConfigStorageTemplateDto' }),
    image: z
      .object({
        thumbnail: AdminConfigGeneratedImageSchema,
        preview: AdminConfigGeneratedImageSchema,
        fullsize: z
          .object({
            enabled: configBool.describe('Enabled').meta({ visibility: User }),
            format: ImageFormatSchema,
            quality: z.int().min(1).max(100).describe('Quality'),
            progressive: configBool.default(false).optional().describe('Progressive'),
          })
          .meta({ id: 'AdminConfigGeneratedFullsizeImageDto' }),
        colorspace: ColorspaceSchema,
        extractEmbedded: configBool.describe('Extract embedded'),
      })
      .meta({ id: 'AdminConfigImageDto' }),
    newVersionCheck: z
      .object({ enabled: configBool.describe('Enabled'), channel: ReleaseChannelSchema })
      .meta({ id: 'AdminConfigNewVersionCheckDto' }),
    nightlyTasks: z
      .object({
        startTime: z.iso
          .time({
            precision: -1,
            error: (iss) => `Invalid input: expected string in HH:MM format, received ${typeof iss.input}`,
          })
          .describe('Start time (HH:MM)'),
        databaseCleanup: configBool.describe('Database cleanup'),
        missingThumbnails: configBool.describe('Missing thumbnails'),
        clusterNewFaces: configBool.describe('Cluster new faces'),
        generateMemories: configBool.describe('Generate memories'),
        syncQuotaUsage: configBool.describe('Sync quota usage'),
      })
      .meta({ id: 'AdminConfigNightlyTasksDto' }),
    trash: z
      .object({
        enabled: configBool.describe('Enabled').meta({ visibility: User }),
        days: z.int().min(0).describe('Days').meta({ visibility: User }),
      })
      .meta({ id: 'AdminConfigTrashDto' }),
    theme: z
      .object({ customCss: z.string().describe('Custom CSS for theming').meta({ visibility: Public }) })
      .meta({ id: 'AdminConfigThemeDto' }),
    library: z
      .object({
        scan: z
          .object({
            enabled: configBool.describe('Enabled'),
            cronExpression: cronExpressionSchema,
          })
          .meta({ id: 'AdminConfigLibraryScanDto' }),
        watch: z.object({ enabled: configBool.describe('Enabled') }).meta({ id: 'AdminConfigLibraryWatchDto' }),
      })
      .meta({ id: 'AdminConfigLibraryDto' }),
    notifications: z.object({ smtp: AdminConfigSmtpSchema }).meta({ id: 'AdminConfigNotificationsDto' }),
    templates: z
      .object({
        email: z
          .object({
            welcomeTemplate: z.string().describe('Welcome template'),
            albumInviteTemplate: z.string().describe('Album invite template'),
            albumUpdateTemplate: z.string().describe('Album update template'),
          })
          .meta({ id: 'AdminConfigTemplateEmailsDto' }),
      })
      .meta({ id: 'AdminConfigTemplatesDto' }),
    server: z
      .object({
        externalDomain: emptyOrUrl('External domain must be an empty string or a valid URL')
          .describe('External domain')
          .meta({ visibility: User }),
        loginPageMessage: z.string().describe('Login page message').meta({ visibility: Public }),
        publicUsers: configBool.describe('Public users').meta({ visibility: User }),
      })
      .meta({ id: 'AdminConfigServerDto' }),
    user: z
      .object({ deleteDelay: z.int().min(1).describe('Delete delay').meta({ visibility: User }) })
      .meta({ id: 'AdminConfigUserDto' }),
  })
  .describe('Configuration properties that are visible to the admin')
  .meta({ id: 'AdminConfigDto' });

export type SystemConfig = z.infer<typeof AdminConfigSchemaWithVisibility>;
export type MachineLearningConfig = SystemConfig['machineLearning'];

const visibilities = [Public, User, Admin];

const isVisible = (property: ConfigVisibility, visibility: ConfigVisibility) =>
  visibilities.indexOf(property) <= visibilities.indexOf(visibility);

const getMeta = (schema: z.ZodType) =>
  (z.globalRegistry.get(schema) ?? {}) as { id?: string; description?: string; visibility?: ConfigVisibility };

const unwrap = (schema: z.ZodType) => (schema instanceof z.ZodPipe ? (schema.def.in as z.ZodType) : schema);

const visibleSchemas = new Map<z.ZodType, Map<ConfigVisibility, z.ZodType | undefined>>();

const applyVisibility = (visibility: ConfigVisibility): z.ZodType | undefined => {
  const map: Record<ConfigVisibility, string> = {
    [Admin]: 'Configuration properties that are visible to the admin',
    [User]: 'Configuration properties that are visible to a logged user',
    [Public]: 'Configuration properties that are visible to everyone',
  };

  return applyVisibilityRecursive(AdminConfigSchemaWithVisibility, visibility, map[visibility]);
};

const applyVisibilityRecursive = (
  schema: z.ZodType,
  visibility: ConfigVisibility,
  override?: string,
): z.ZodType | undefined => {
  const object = unwrap(schema);
  const { id, description, visibility: property } = getMeta(schema);

  if (!(object instanceof z.ZodObject)) {
    return isVisible(property ?? Admin, visibility) ? schema : undefined;
  }

  let cache = visibleSchemas.get(schema);
  if (!cache) {
    cache = new Map();
    visibleSchemas.set(schema, cache);
  }

  if (cache.has(visibility)) {
    return cache.get(visibility);
  }

  const shape: Record<string, z.ZodType> = {};
  for (const [key, value] of Object.entries(object.shape as Record<string, z.ZodType>)) {
    const visible = applyVisibilityRecursive(value, visibility);
    if (visible) {
      shape[key] = visible;
    }
  }

  let visible: z.ZodType | undefined;
  if (Object.keys(shape).length > 0) {
    visible = z.object(shape).meta({
      ...(id && { id: `${visibility}${id.slice(Admin.length)}` }),
      ...((override ?? description) && { description: override ?? description }),
    });
  }

  cache.set(visibility, visible);

  return visible;
};

const stripVisibilityMetadata = <T extends z.ZodType>(schema: T): T => {
  const object = unwrap(schema);
  if (object instanceof z.ZodObject) {
    for (const value of Object.values(object.shape as Record<string, z.ZodType>)) {
      stripVisibilityMetadata(value);
    }

    return schema;
  }

  const { visibility, ...meta } = getMeta(schema);
  if (visibility) {
    z.globalRegistry.add(schema, meta);
  }

  return schema;
};

const AdminConfigSchema = applyVisibility(Admin)! as z.ZodType<SystemConfig>;
const UserConfigSchema = applyVisibility(User)! as z.ZodType<DeepPartial<SystemConfig>>;
const PublicConfigSchema = applyVisibility(Public)! as z.ZodType<DeepPartial<SystemConfig>>;

// prevent visibility metadata from leaking to openapi spec
// eslint-disable-next-line unicorn/no-top-level-side-effects
stripVisibilityMetadata(AdminConfigSchemaWithVisibility);

const ConfigTemplateStorageOptionSchema = z
  .object({
    yearOptions: z.array(z.string()).describe('Available year format options for storage template'),
    monthOptions: z.array(z.string()).describe('Available month format options for storage template'),
    weekOptions: z.array(z.string()).describe('Available week format options for storage template'),
    dayOptions: z.array(z.string()).describe('Available day format options for storage template'),
    hourOptions: z.array(z.string()).describe('Available hour format options for storage template'),
    minuteOptions: z.array(z.string()).describe('Available minute format options for storage template'),
    secondOptions: z.array(z.string()).describe('Available second format options for storage template'),
    presetOptions: z.array(z.string()).describe('Available preset template options'),
  })
  .meta({ id: 'SystemConfigTemplateStorageOptionDto' });

export class AdminConfigDto extends createZodDto(AdminConfigSchema) {}
export class UserConfigDto extends createZodDto(UserConfigSchema) {}
export class PublicConfigDto extends createZodDto(PublicConfigSchema) {}
export class ConfigFFmpegDto extends createZodDto(AdminConfigFFmpegSchema) {}
export class ConfigSmtpDto extends createZodDto(AdminConfigSmtpSchema) {}
export class ConfigTemplateStorageOptionDto extends createZodDto(ConfigTemplateStorageOptionSchema) {}

/** @deprecated the `/system-config` endpoints these are named after are on their way out */
export { AdminConfigDto as SystemConfigDto, ConfigSmtpDto as SystemConfigSmtpDto };

export function mapAdminConfig(config: SystemConfig): AdminConfigDto {
  return config;
}

export function mapUserConfig(config: SystemConfig): UserConfigDto {
  return UserConfigSchema.parse(config);
}

export function mapPublicConfig(config: SystemConfig): PublicConfigDto {
  return PublicConfigSchema.parse(config);
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
    acceptedAudioCodecs: [AudioCodec.Aac, AudioCodec.Mp3, AudioCodec.Opus],
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
    accelDecode: true,
    realtime: {
      enabled: false,
      videoCodecs: [VideoCodec.H264, VideoCodec.Hevc],
      resolutions: [HlsVideoResolution.p480, HlsVideoResolution.p720, HlsVideoResolution.p1080],
    },
  },
  integrityChecks: {
    missingFiles: {
      enabled: true,
      cronExpression: CronExpression.EVERY_DAY_AT_3AM,
    },
    untrackedFiles: {
      enabled: true,
      cronExpression: CronExpression.EVERY_DAY_AT_3AM,
    },
    checksumFiles: {
      enabled: true,
      cronExpression: CronExpression.EVERY_DAY_AT_3AM,
      timeLimit: 60 * 60 * 1000, // 1 hour
      percentageLimit: 1, // 100% of assets
    },
  },
  job: {
    thumbnailGeneration: { concurrency: 3 },
    metadataExtraction: { concurrency: 5 },
    videoConversion: { concurrency: 1 },
    faceDetection: { concurrency: 2 },
    smartSearch: { concurrency: 2 },
    backgroundTask: { concurrency: 5 },
    migration: { concurrency: 5 },
    search: { concurrency: 5 },
    sidecar: { concurrency: 5 },
    library: { concurrency: 5 },
    notifications: { concurrency: 5 },
    ocr: { concurrency: 1 },
    workflow: { concurrency: 5 },
    editor: { concurrency: 2 },
    integrityCheck: { concurrency: 1 },
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
      timeout: 2000,
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
    accountManagementUrl: '',
    endSessionEndpoint: '',
    mobileOverrideEnabled: false,
    mobileRedirectUri: '',
    prompt: '',
    scope: 'openid email profile',
    signingAlgorithm: 'RS256',
    profileSigningAlgorithm: 'none',
    storageLabelClaim: 'preferred_username',
    storageQuotaClaim: 'immich_quota',
    roleClaim: 'immich_role',
    tokenEndpointAuthMethod: OAuthTokenEndpointAuthMethod.ClientSecretPost,
    timeout: 30_000,
    allowInsecureRequests: false,
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
      progressive: false,
    },
    preview: {
      format: ImageFormat.Jpeg,
      size: 1440,
      quality: 80,
      progressive: false,
    },
    colorspace: Colorspace.P3,
    extractEmbedded: false,
    fullsize: {
      enabled: false,
      format: ImageFormat.Jpeg,
      quality: 80,
      progressive: false,
    },
  },
  newVersionCheck: {
    enabled: true,
    channel: ReleaseChannel.Stable,
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
