import { createZodDto } from 'nestjs-zod';
import { SystemConfig } from 'src/config';
import {
  CLIPConfigSchema,
  DuplicateDetectionConfigSchema,
  FacialRecognitionConfigSchema,
  OcrConfigSchema,
} from 'src/dtos/model-config.dto';
import {
  AudioCodec,
  AudioCodecSchema,
  ColorspaceSchema,
  CQModeSchema,
  ImageFormatSchema,
  LogLevelSchema,
  OAuthTokenEndpointAuthMethodSchema,
  ToneMappingSchema,
  TranscodeHardwareAccelerationSchema,
  TranscodePolicySchema,
  VideoCodecSchema,
  VideoContainerSchema,
} from 'src/enum';
import { isValidTime } from 'src/validation';
import z from 'zod';

/** Coerces 'true'/'false' strings to boolean, but also allows booleans. */
const configBool = z
  .preprocess((val) => {
    if (val === 'true') {
      return true;
    }
    if (val === 'false') {
      return false;
    }
    return val;
  }, z.boolean())
  .meta({ type: 'boolean' });

const JobSettingsSchema = z
  .object({
    concurrency: z.int().min(1).describe('Concurrency'),
  })
  .meta({ id: 'JobSettingsDto' });

const cronExpressionSchema = z
  .string()
  .regex(/(((\d+,)+\d+|(\d+(\/|-)\d+)|\d+|\*) ?){5,7}/, 'Invalid cron expression')
  .describe('Cron expression');

const DatabaseBackupSchema = z
  .object({
    enabled: configBool.describe('Enabled'),
    cronExpression: cronExpressionSchema,
    keepLastAmount: z.number().min(1).describe('Keep last amount'),
  })
  .meta({ id: 'DatabaseBackupConfig' });

const SystemConfigBackupsSchema = z.object({ database: DatabaseBackupSchema }).meta({ id: 'SystemConfigBackupsDto' });

const SystemConfigFFmpegSchema = z
  .object({
    crf: z.coerce.number().int().min(0).max(51).describe('CRF'),
    threads: z.coerce.number().int().min(0).describe('Threads'),
    preset: z.string().describe('Preset'),
    targetVideoCodec: VideoCodecSchema,
    acceptedVideoCodecs: z.array(VideoCodecSchema).describe('Accepted video codecs'),
    targetAudioCodec: AudioCodecSchema,
    acceptedAudioCodecs: z
      .array(AudioCodecSchema)
      .transform((value): AudioCodec[] => value.map((v) => (v === AudioCodec.Libopus ? AudioCodec.Opus : v)))
      .describe('Accepted audio codecs'),
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
  })
  .meta({ id: 'SystemConfigFFmpegDto' });

const SystemConfigJobSchema = z
  .object({
    thumbnailGeneration: JobSettingsSchema,
    metadataExtraction: JobSettingsSchema,
    videoConversion: JobSettingsSchema,
    faceDetection: JobSettingsSchema,
    smartSearch: JobSettingsSchema,
    backgroundTask: JobSettingsSchema,
    migration: JobSettingsSchema,
    search: JobSettingsSchema,
    sidecar: JobSettingsSchema,
    library: JobSettingsSchema,
    notifications: JobSettingsSchema,
    ocr: JobSettingsSchema,
    workflow: JobSettingsSchema,
    editor: JobSettingsSchema,
  })
  .meta({ id: 'SystemConfigJobDto' });

const SystemConfigLibraryScanSchema = z
  .object({
    enabled: configBool.describe('Enabled'),
    cronExpression: cronExpressionSchema,
  })
  .meta({ id: 'SystemConfigLibraryScanDto' });

const SystemConfigLibraryWatchSchema = z
  .object({ enabled: configBool.describe('Enabled') })
  .meta({ id: 'SystemConfigLibraryWatchDto' });

const SystemConfigLibrarySchema = z
  .object({ scan: SystemConfigLibraryScanSchema, watch: SystemConfigLibraryWatchSchema })
  .meta({ id: 'SystemConfigLibraryDto' });

const SystemConfigLoggingSchema = z
  .object({
    enabled: configBool.describe('Enabled'),
    level: LogLevelSchema,
  })
  .meta({ id: 'SystemConfigLoggingDto' });

const MachineLearningAvailabilityChecksSchema = z
  .object({
    enabled: configBool.describe('Enabled'),
    timeout: z.number(),
    interval: z.number(),
  })
  .meta({ id: 'MachineLearningAvailabilityChecksDto' });

const SystemConfigMachineLearningSchema = z
  .object({
    enabled: configBool.describe('Enabled'),
    urls: z.array(z.string()).min(1).describe('ML service URLs'),
    availabilityChecks: MachineLearningAvailabilityChecksSchema,
    clip: CLIPConfigSchema,
    duplicateDetection: DuplicateDetectionConfigSchema,
    facialRecognition: FacialRecognitionConfigSchema,
    ocr: OcrConfigSchema,
  })
  .meta({ id: 'SystemConfigMachineLearningDto' });

const SystemConfigMapSchema = z
  .object({
    enabled: configBool.describe('Enabled'),
    lightStyle: z.url().describe('Light map style URL'),
    darkStyle: z.url().describe('Dark map style URL'),
  })
  .meta({ id: 'SystemConfigMapDto' });

const SystemConfigNewVersionCheckSchema = z
  .object({ enabled: configBool.describe('Enabled') })
  .meta({ id: 'SystemConfigNewVersionCheckDto' });

const SystemConfigNightlyTasksSchema = z
  .object({
    startTime: isValidTime.describe('Start time'),
    databaseCleanup: configBool.describe('Database cleanup'),
    missingThumbnails: configBool.describe('Missing thumbnails'),
    clusterNewFaces: configBool.describe('Cluster new faces'),
    generateMemories: configBool.describe('Generate memories'),
    syncQuotaUsage: configBool.describe('Sync quota usage'),
  })
  .meta({ id: 'SystemConfigNightlyTasksDto' });

const SystemConfigOAuthSchema = z
  .object({
    autoLaunch: configBool.describe('Auto launch'),
    autoRegister: configBool.describe('Auto register'),
    buttonText: z.string().describe('Button text'),
    clientId: z.string().describe('Client ID'),
    clientSecret: z.string().describe('Client secret'),
    tokenEndpointAuthMethod: OAuthTokenEndpointAuthMethodSchema,
    timeout: z.int().min(1).describe('Timeout'),
    defaultStorageQuota: z.number().min(0).nullable().describe('Default storage quota'),
    enabled: configBool.describe('Enabled'),
    issuerUrl: z.string().describe('Issuer URL'),
    scope: z.string().describe('Scope'),
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
  .meta({
    id: 'SystemConfigOAuthDto',
  });

const SystemConfigPasswordLoginSchema = z
  .object({ enabled: configBool.describe('Enabled') })
  .meta({ id: 'SystemConfigPasswordLoginDto' });

const SystemConfigReverseGeocodingSchema = z
  .object({ enabled: configBool.describe('Enabled') })
  .meta({ id: 'SystemConfigReverseGeocodingDto' });

const SystemConfigFacesSchema = z
  .object({ import: configBool.describe('Import') })
  .meta({ id: 'SystemConfigFacesDto' });
const SystemConfigMetadataSchema = z.object({ faces: SystemConfigFacesSchema }).meta({ id: 'SystemConfigMetadataDto' });

const SystemConfigServerSchema = z
  .object({
    externalDomain: z
      .string()
      .refine((url) => url.length === 0 || z.url().safeParse(url).success, {
        error: 'External domain must be an empty string or a valid URL',
      })
      .describe('External domain'),
    loginPageMessage: z.string().describe('Login page message'),
    publicUsers: configBool.describe('Public users'),
  })
  .meta({ id: 'SystemConfigServerDto' });

const SystemConfigSmtpTransportSchema = z
  .object({
    ignoreCert: configBool.describe('Whether to ignore SSL certificate errors'),
    host: z.string().describe('SMTP server hostname'),
    port: z.number().min(0).max(65_535).describe('SMTP server port'),
    secure: configBool.describe('Whether to use secure connection (TLS/SSL)'),
    username: z.string().describe('SMTP username'),
    password: z.string().describe('SMTP password'),
  })
  .meta({ id: 'SystemConfigSmtpTransportDto' });

const SystemConfigSmtpSchema = z
  .object({
    enabled: configBool.describe('Whether SMTP email notifications are enabled'),
    from: z.string().describe('Email address to send from'),
    replyTo: z.string().describe('Email address for replies'),
    transport: SystemConfigSmtpTransportSchema,
  })
  .meta({ id: 'SystemConfigSmtpDto' });

const SystemConfigNotificationsSchema = z
  .object({ smtp: SystemConfigSmtpSchema })
  .meta({ id: 'SystemConfigNotificationsDto' });

const SystemConfigTemplateEmailsSchema = z
  .object({
    albumInviteTemplate: z.string().describe('Album invite template'),
    welcomeTemplate: z.string().describe('Welcome template'),
    albumUpdateTemplate: z.string().describe('Album update template'),
  })
  .meta({ id: 'SystemConfigTemplateEmailsDto' });
const SystemConfigTemplatesSchema = z
  .object({ email: SystemConfigTemplateEmailsSchema })
  .meta({ id: 'SystemConfigTemplatesDto' });

const SystemConfigStorageTemplateSchema = z
  .object({
    enabled: configBool.describe('Enabled'),
    hashVerificationEnabled: configBool.describe('Hash verification enabled'),
    template: z.string().describe('Template'),
  })
  .meta({ id: 'SystemConfigStorageTemplateDto' });

const SystemConfigTemplateStorageOptionSchema = z
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

const SystemConfigThemeSchema = z
  .object({ customCss: z.string().describe('Custom CSS for theming') })
  .meta({ id: 'SystemConfigThemeDto' });

const SystemConfigGeneratedImageSchema = z
  .object({
    format: ImageFormatSchema,
    quality: z.int().min(1).max(100).describe('Quality'),
    size: z.int().min(1).describe('Size'),
    progressive: configBool.default(false).optional().describe('Progressive'),
  })
  .meta({ id: 'SystemConfigGeneratedImageDto' });

const SystemConfigGeneratedFullsizeImageSchema = z
  .object({
    enabled: configBool.describe('Enabled'),
    format: ImageFormatSchema,
    quality: z.int().min(1).max(100).describe('Quality'),
    progressive: configBool.default(false).optional().describe('Progressive'),
  })
  .meta({ id: 'SystemConfigGeneratedFullsizeImageDto' });

const SystemConfigImageSchema = z
  .object({
    thumbnail: SystemConfigGeneratedImageSchema,
    preview: SystemConfigGeneratedImageSchema,
    fullsize: SystemConfigGeneratedFullsizeImageSchema,
    colorspace: ColorspaceSchema,
    extractEmbedded: configBool.describe('Extract embedded'),
  })
  .meta({ id: 'SystemConfigImageDto' });

const SystemConfigTrashSchema = z
  .object({
    enabled: configBool.describe('Enabled'),
    days: z.int().min(0).describe('Days'),
  })
  .meta({ id: 'SystemConfigTrashDto' });

const SystemConfigUserSchema = z
  .object({
    deleteDelay: z.int().min(1).describe('Delete delay'),
  })
  .meta({ id: 'SystemConfigUserDto' });

export const SystemConfigSchema = z
  .object({
    backup: SystemConfigBackupsSchema,
    ffmpeg: SystemConfigFFmpegSchema,
    logging: SystemConfigLoggingSchema,
    machineLearning: SystemConfigMachineLearningSchema,
    map: SystemConfigMapSchema,
    newVersionCheck: SystemConfigNewVersionCheckSchema,
    nightlyTasks: SystemConfigNightlyTasksSchema,
    oauth: SystemConfigOAuthSchema,
    passwordLogin: SystemConfigPasswordLoginSchema,
    reverseGeocoding: SystemConfigReverseGeocodingSchema,
    metadata: SystemConfigMetadataSchema,
    storageTemplate: SystemConfigStorageTemplateSchema,
    job: SystemConfigJobSchema,
    image: SystemConfigImageSchema,
    trash: SystemConfigTrashSchema,
    theme: SystemConfigThemeSchema,
    library: SystemConfigLibrarySchema,
    notifications: SystemConfigNotificationsSchema,
    templates: SystemConfigTemplatesSchema,
    server: SystemConfigServerSchema,
    user: SystemConfigUserSchema,
  })
  .describe('System configuration')
  .meta({ id: 'SystemConfigDto' });

export class SystemConfigFFmpegDto extends createZodDto(SystemConfigFFmpegSchema) {}
export class SystemConfigSmtpDto extends createZodDto(SystemConfigSmtpSchema) {}
export class SystemConfigTemplateStorageOptionDto extends createZodDto(SystemConfigTemplateStorageOptionSchema) {}
export class SystemConfigDto extends createZodDto(SystemConfigSchema) {}

export function mapConfig(config: SystemConfig): SystemConfigDto {
  return config;
}
