import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsPositive,
  IsString,
  IsUrl,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { SystemConfig } from 'src/config';
import { CLIPConfig, DuplicateDetectionConfig, FacialRecognitionConfig, OcrConfig } from 'src/dtos/model-config.dto';
import {
  AudioCodec,
  CQMode,
  Colorspace,
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
import { ConcurrentQueueName } from 'src/types';
import { IsCronExpression, IsDateStringFormat, Optional, ValidateBoolean, ValidateEnum } from 'src/validation';

const isLibraryScanEnabled = (config: SystemConfigLibraryScanDto) => config.enabled;
const isOAuthEnabled = (config: SystemConfigOAuthDto) => config.enabled;
const isOAuthOverrideEnabled = (config: SystemConfigOAuthDto) => config.mobileOverrideEnabled;
const isEmailNotificationEnabled = (config: SystemConfigSmtpDto) => config.enabled;
const isDatabaseBackupEnabled = (config: DatabaseBackupConfig) => config.enabled;

export class DatabaseBackupConfig {
  @ValidateBoolean({ description: 'Enabled' })
  enabled!: boolean;

  @ValidateIf(isDatabaseBackupEnabled)
  @IsNotEmpty()
  @IsCronExpression()
  @IsString()
  @ApiProperty({ description: 'Cron expression' })
  cronExpression!: string;

  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  @ApiProperty({ description: 'Keep last amount' })
  keepLastAmount!: number;
}

export class SystemConfigBackupsDto {
  @Type(() => DatabaseBackupConfig)
  @ValidateNested()
  @IsObject()
  database!: DatabaseBackupConfig;
}

export class SystemConfigFFmpegDto {
  @IsInt()
  @Min(0)
  @Max(51)
  @Type(() => Number)
  @ApiProperty({ type: 'integer', description: 'CRF' })
  crf!: number;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  @ApiProperty({ type: 'integer', description: 'Threads' })
  threads!: number;

  @IsString()
  @ApiProperty({ description: 'Preset' })
  preset!: string;

  @ValidateEnum({ enum: VideoCodec, name: 'VideoCodec', description: 'Target video codec' })
  targetVideoCodec!: VideoCodec;

  @ValidateEnum({ enum: VideoCodec, name: 'VideoCodec', each: true, description: 'Accepted video codecs' })
  acceptedVideoCodecs!: VideoCodec[];

  @ValidateEnum({ enum: AudioCodec, name: 'AudioCodec', description: 'Target audio codec' })
  targetAudioCodec!: AudioCodec;

  @ValidateEnum({ enum: AudioCodec, name: 'AudioCodec', each: true, description: 'Accepted audio codecs' })
  acceptedAudioCodecs!: AudioCodec[];

  @ValidateEnum({ enum: VideoContainer, name: 'VideoContainer', each: true, description: 'Accepted containers' })
  acceptedContainers!: VideoContainer[];

  @IsString()
  @ApiProperty({ description: 'Target resolution' })
  targetResolution!: string;

  @IsString()
  @ApiProperty({ description: 'Max bitrate' })
  maxBitrate!: string;

  @IsInt()
  @Min(-1)
  @Max(16)
  @Type(() => Number)
  @ApiProperty({ type: 'integer', description: 'B-frames' })
  bframes!: number;

  @IsInt()
  @Min(0)
  @Max(6)
  @Type(() => Number)
  @ApiProperty({ type: 'integer', description: 'References' })
  refs!: number;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  @ApiProperty({ type: 'integer', description: 'GOP size' })
  gopSize!: number;

  @ValidateBoolean({ description: 'Temporal AQ' })
  temporalAQ!: boolean;

  @ValidateEnum({ enum: CQMode, name: 'CQMode', description: 'CQ mode' })
  cqMode!: CQMode;

  @ValidateBoolean({ description: 'Two pass' })
  twoPass!: boolean;

  @ApiProperty({ description: 'Preferred hardware device' })
  @IsString()
  preferredHwDevice!: string;

  @ValidateEnum({ enum: TranscodePolicy, name: 'TranscodePolicy', description: 'Transcode policy' })
  transcode!: TranscodePolicy;

  @ValidateEnum({
    enum: TranscodeHardwareAcceleration,
    name: 'TranscodeHWAccel',
    description: 'Transcode hardware acceleration',
  })
  accel!: TranscodeHardwareAcceleration;

  @ValidateBoolean({ description: 'Accelerated decode' })
  accelDecode!: boolean;

  @ValidateEnum({ enum: ToneMapping, name: 'ToneMapping', description: 'Tone mapping' })
  tonemap!: ToneMapping;
}

class JobSettingsDto {
  @IsInt()
  @IsPositive()
  @ApiProperty({ type: 'integer', description: 'Concurrency' })
  concurrency!: number;
}

class SystemConfigJobDto implements Record<ConcurrentQueueName, JobSettingsDto> {
  @ApiProperty({ type: JobSettingsDto, description: undefined })
  @ValidateNested()
  @IsObject()
  @Type(() => JobSettingsDto)
  [QueueName.ThumbnailGeneration]!: JobSettingsDto;

  @ApiProperty({ type: JobSettingsDto, description: undefined })
  @ValidateNested()
  @IsObject()
  @Type(() => JobSettingsDto)
  [QueueName.MetadataExtraction]!: JobSettingsDto;

  @ApiProperty({ type: JobSettingsDto, description: undefined })
  @ValidateNested()
  @IsObject()
  @Type(() => JobSettingsDto)
  [QueueName.VideoConversion]!: JobSettingsDto;

  @ApiProperty({ type: JobSettingsDto, description: undefined })
  @ValidateNested()
  @IsObject()
  @Type(() => JobSettingsDto)
  [QueueName.SmartSearch]!: JobSettingsDto;

  @ApiProperty({ type: JobSettingsDto, description: undefined })
  @ValidateNested()
  @IsObject()
  @Type(() => JobSettingsDto)
  [QueueName.Migration]!: JobSettingsDto;

  @ApiProperty({ type: JobSettingsDto, description: undefined })
  @ValidateNested()
  @IsObject()
  @Type(() => JobSettingsDto)
  [QueueName.BackgroundTask]!: JobSettingsDto;

  @ApiProperty({ type: JobSettingsDto, description: undefined })
  @ValidateNested()
  @IsObject()
  @Type(() => JobSettingsDto)
  [QueueName.Search]!: JobSettingsDto;

  @ApiProperty({ type: JobSettingsDto, description: undefined })
  @ValidateNested()
  @IsObject()
  @Type(() => JobSettingsDto)
  [QueueName.FaceDetection]!: JobSettingsDto;

  @ApiProperty({ type: JobSettingsDto, description: undefined })
  @ValidateNested()
  @IsObject()
  @Type(() => JobSettingsDto)
  [QueueName.Ocr]!: JobSettingsDto;

  @ApiProperty({ type: JobSettingsDto, description: undefined })
  @ValidateNested()
  @IsObject()
  @Type(() => JobSettingsDto)
  [QueueName.Sidecar]!: JobSettingsDto;

  @ApiProperty({ type: JobSettingsDto, description: undefined })
  @ValidateNested()
  @IsObject()
  @Type(() => JobSettingsDto)
  [QueueName.Library]!: JobSettingsDto;

  @ApiProperty({ type: JobSettingsDto, description: undefined })
  @ValidateNested()
  @IsObject()
  @Type(() => JobSettingsDto)
  [QueueName.Notification]!: JobSettingsDto;

  @ApiProperty({ type: JobSettingsDto, description: undefined })
  @ValidateNested()
  @IsObject()
  @Type(() => JobSettingsDto)
  [QueueName.Workflow]!: JobSettingsDto;

  @ApiProperty({ type: JobSettingsDto, description: undefined })
  @ValidateNested()
  @IsObject()
  @Type(() => JobSettingsDto)
  [QueueName.Editor]!: JobSettingsDto;
}

class SystemConfigLibraryScanDto {
  @ValidateBoolean({ description: 'Enabled' })
  enabled!: boolean;

  @ValidateIf(isLibraryScanEnabled)
  @IsNotEmpty()
  @IsCronExpression()
  @IsString()
  cronExpression!: string;
}

class SystemConfigLibraryWatchDto {
  @ValidateBoolean({ description: 'Enabled' })
  enabled!: boolean;
}

class SystemConfigLibraryDto {
  @Type(() => SystemConfigLibraryScanDto)
  @ValidateNested()
  @IsObject()
  scan!: SystemConfigLibraryScanDto;

  @Type(() => SystemConfigLibraryWatchDto)
  @ValidateNested()
  @IsObject()
  watch!: SystemConfigLibraryWatchDto;
}

class SystemConfigLoggingDto {
  @ValidateBoolean({ description: 'Enabled' })
  enabled!: boolean;

  @ValidateEnum({ enum: LogLevel, name: 'LogLevel' })
  level!: LogLevel;
}

class MachineLearningAvailabilityChecksDto {
  @ValidateBoolean({ description: 'Enabled' })
  enabled!: boolean;

  @IsInt()
  timeout!: number;

  @IsInt()
  interval!: number;
}

class SystemConfigMachineLearningDto {
  @ValidateBoolean({ description: 'Enabled' })
  enabled!: boolean;

  @IsUrl({ require_tld: false, allow_underscores: true }, { each: true })
  @ArrayMinSize(1)
  @ValidateIf((dto) => dto.enabled)
  @ApiProperty({ type: 'array', items: { type: 'string', format: 'uri' }, minItems: 1 })
  urls!: string[];

  @Type(() => MachineLearningAvailabilityChecksDto)
  @ValidateNested()
  @IsObject()
  availabilityChecks!: MachineLearningAvailabilityChecksDto;

  @Type(() => CLIPConfig)
  @ValidateNested()
  @IsObject()
  clip!: CLIPConfig;

  @Type(() => DuplicateDetectionConfig)
  @ValidateNested()
  @IsObject()
  duplicateDetection!: DuplicateDetectionConfig;

  @Type(() => FacialRecognitionConfig)
  @ValidateNested()
  @IsObject()
  facialRecognition!: FacialRecognitionConfig;

  @Type(() => OcrConfig)
  @ValidateNested()
  @IsObject()
  ocr!: OcrConfig;
}

enum MapTheme {
  LIGHT = 'light',
  DARK = 'dark',
}

export class MapThemeDto {
  @ValidateEnum({ enum: MapTheme, name: 'MapTheme' })
  theme!: MapTheme;
}

class SystemConfigMapDto {
  @ValidateBoolean({ description: 'Enabled' })
  enabled!: boolean;

  @IsNotEmpty()
  @IsUrl()
  lightStyle!: string;

  @IsNotEmpty()
  @IsUrl()
  darkStyle!: string;
}

class SystemConfigNewVersionCheckDto {
  @ValidateBoolean({ description: 'Enabled' })
  enabled!: boolean;
}

class SystemConfigNightlyTasksDto {
  @IsDateStringFormat('HH:mm', { message: 'startTime must be in HH:mm format' })
  startTime!: string;

  @ValidateBoolean({ description: 'Database cleanup' })
  databaseCleanup!: boolean;

  @ValidateBoolean({ description: 'Missing thumbnails' })
  missingThumbnails!: boolean;

  @ValidateBoolean({ description: 'Cluster new faces' })
  clusterNewFaces!: boolean;

  @ValidateBoolean({ description: 'Generate memories' })
  generateMemories!: boolean;

  @ValidateBoolean({ description: 'Sync quota usage' })
  syncQuotaUsage!: boolean;
}

class SystemConfigOAuthDto {
  @ValidateBoolean({ description: 'Auto launch' })
  autoLaunch!: boolean;

  @ValidateBoolean({ description: 'Auto register' })
  autoRegister!: boolean;

  @IsString()
  @ApiProperty({ description: 'Button text' })
  buttonText!: string;

  @ValidateIf(isOAuthEnabled)
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'Client ID' })
  clientId!: string;

  @ValidateIf(isOAuthEnabled)
  @IsString()
  @ApiProperty({ description: 'Client secret' })
  clientSecret!: string;

  @ValidateEnum({
    enum: OAuthTokenEndpointAuthMethod,
    name: 'OAuthTokenEndpointAuthMethod',
    description: 'Token endpoint auth method',
  })
  tokenEndpointAuthMethod!: OAuthTokenEndpointAuthMethod;

  @IsInt()
  @IsPositive()
  @Optional()
  @ApiProperty({ type: 'integer', description: 'Timeout' })
  timeout!: number;

  @IsNumber()
  @Min(0)
  @Optional({ nullable: true })
  @ApiProperty({ type: 'integer', format: 'int64', description: 'Default storage quota' })
  defaultStorageQuota!: number | null;

  @ValidateBoolean({ description: 'Enabled' })
  enabled!: boolean;

  @ValidateIf(isOAuthEnabled)
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'Issuer URL' })
  issuerUrl!: string;

  @ValidateBoolean({ description: 'Mobile override enabled' })
  mobileOverrideEnabled!: boolean;

  @ValidateIf(isOAuthOverrideEnabled)
  @IsUrl()
  @ApiProperty({ description: 'Mobile redirect URI' })
  mobileRedirectUri!: string;

  @IsString()
  @ApiProperty({ description: 'Scope' })
  scope!: string;

  @IsString()
  @IsNotEmpty()
  signingAlgorithm!: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Profile signing algorithm' })
  profileSigningAlgorithm!: string;

  @IsString()
  @ApiProperty({ description: 'Storage label claim' })
  storageLabelClaim!: string;

  @IsString()
  @ApiProperty({ description: 'Storage quota claim' })
  storageQuotaClaim!: string;

  @IsString()
  @ApiProperty({ description: 'Role claim' })
  roleClaim!: string;
}

class SystemConfigPasswordLoginDto {
  @ValidateBoolean({ description: 'Enabled' })
  enabled!: boolean;
}

class SystemConfigReverseGeocodingDto {
  @ValidateBoolean({ description: 'Enabled' })
  enabled!: boolean;
}

class SystemConfigFacesDto {
  @ValidateBoolean({ description: 'Import' })
  import!: boolean;
}

class SystemConfigMetadataDto {
  @Type(() => SystemConfigFacesDto)
  @ValidateNested()
  @IsObject()
  faces!: SystemConfigFacesDto;
}

class SystemConfigServerDto {
  @ValidateIf((_, value: string) => value !== '')
  @IsUrl({ require_tld: false, require_protocol: true, protocols: ['http', 'https'] })
  @ApiProperty({ description: 'External domain' })
  externalDomain!: string;

  @IsString()
  @ApiProperty({ description: 'Login page message' })
  loginPageMessage!: string;

  @ValidateBoolean({ description: 'Public users' })
  publicUsers!: boolean;
}

class SystemConfigSmtpTransportDto {
  @ValidateBoolean({ description: 'Whether to ignore SSL certificate errors' })
  ignoreCert!: boolean;

  @ApiProperty({ description: 'SMTP server hostname' })
  @IsNotEmpty()
  @IsString()
  host!: string;

  @ApiProperty({ description: 'SMTP server port', type: Number, minimum: 0, maximum: 65_535 })
  @IsNumber()
  @Min(0)
  @Max(65_535)
  port!: number;

  @ValidateBoolean({ description: 'Whether to use secure connection (TLS/SSL)' })
  secure!: boolean;

  @ApiProperty({ description: 'SMTP username' })
  @IsString()
  username!: string;

  @ApiProperty({ description: 'SMTP password' })
  @IsString()
  password!: string;
}

export class SystemConfigSmtpDto {
  @ValidateBoolean({ description: 'Whether SMTP email notifications are enabled' })
  enabled!: boolean;

  @ApiProperty({ description: 'Email address to send from' })
  @ValidateIf(isEmailNotificationEnabled)
  @IsNotEmpty()
  @IsString()
  @IsNotEmpty()
  from!: string;

  @ApiProperty({ description: 'Email address for replies' })
  @IsString()
  replyTo!: string;

  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  @ValidateIf(isEmailNotificationEnabled)
  @Type(() => SystemConfigSmtpTransportDto)
  @ValidateNested()
  @IsObject()
  transport!: SystemConfigSmtpTransportDto;
}

class SystemConfigNotificationsDto {
  @Type(() => SystemConfigSmtpDto)
  @ValidateNested()
  @IsObject()
  smtp!: SystemConfigSmtpDto;
}

class SystemConfigTemplateEmailsDto {
  @IsString()
  albumInviteTemplate!: string;

  @IsString()
  welcomeTemplate!: string;

  @IsString()
  albumUpdateTemplate!: string;
}

class SystemConfigTemplatesDto {
  @Type(() => SystemConfigTemplateEmailsDto)
  @ValidateNested()
  @IsObject()
  email!: SystemConfigTemplateEmailsDto;
}

class SystemConfigStorageTemplateDto {
  @ValidateBoolean({ description: 'Enabled' })
  enabled!: boolean;

  @ValidateBoolean({ description: 'Hash verification enabled' })
  hashVerificationEnabled!: boolean;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'Template' })
  template!: string;
}

export class SystemConfigTemplateStorageOptionDto {
  @ApiProperty({ description: 'Available year format options for storage template' })
  yearOptions!: string[];
  @ApiProperty({ description: 'Available month format options for storage template' })
  monthOptions!: string[];
  @ApiProperty({ description: 'Available week format options for storage template' })
  weekOptions!: string[];
  @ApiProperty({ description: 'Available day format options for storage template' })
  dayOptions!: string[];
  @ApiProperty({ description: 'Available hour format options for storage template' })
  hourOptions!: string[];
  @ApiProperty({ description: 'Available minute format options for storage template' })
  minuteOptions!: string[];
  @ApiProperty({ description: 'Available second format options for storage template' })
  secondOptions!: string[];
  @ApiProperty({ description: 'Available preset template options' })
  presetOptions!: string[];
}

export class SystemConfigThemeDto {
  @ApiProperty({ description: 'Custom CSS for theming' })
  @IsString()
  customCss!: string;
}

class SystemConfigGeneratedImageDto {
  @ValidateEnum({ enum: ImageFormat, name: 'ImageFormat', description: 'Image format' })
  format!: ImageFormat;

  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @ApiProperty({ type: 'integer', description: 'Quality' })
  quality!: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  @ApiProperty({ type: 'integer', description: 'Size' })
  size!: number;

  @ValidateBoolean({ optional: true, default: false })
  progressive?: boolean;
}

class SystemConfigGeneratedFullsizeImageDto {
  @ValidateBoolean({ description: 'Enabled' })
  enabled!: boolean;

  @ValidateEnum({ enum: ImageFormat, name: 'ImageFormat', description: 'Image format' })
  format!: ImageFormat;

  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @ApiProperty({ type: 'integer', description: 'Quality' })
  quality!: number;

  @ValidateBoolean({ optional: true, default: false, description: 'Progressive' })
  progressive?: boolean;
}

export class SystemConfigImageDto {
  @Type(() => SystemConfigGeneratedImageDto)
  @ValidateNested()
  @IsObject()
  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  thumbnail!: SystemConfigGeneratedImageDto;

  @Type(() => SystemConfigGeneratedImageDto)
  @ValidateNested()
  @IsObject()
  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  preview!: SystemConfigGeneratedImageDto;

  @Type(() => SystemConfigGeneratedFullsizeImageDto)
  @ValidateNested()
  @IsObject()
  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  fullsize!: SystemConfigGeneratedFullsizeImageDto;

  @ValidateEnum({ enum: Colorspace, name: 'Colorspace', description: 'Colorspace' })
  colorspace!: Colorspace;

  @ValidateBoolean({ description: 'Extract embedded' })
  extractEmbedded!: boolean;
}

class SystemConfigTrashDto {
  @ValidateBoolean({ description: 'Enabled' })
  enabled!: boolean;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  @ApiProperty({ type: 'integer', description: 'Days' })
  days!: number;
}

class SystemConfigUserDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @ApiProperty({ type: 'integer', description: 'Delete delay' })
  deleteDelay!: number;
}

export class SystemConfigDto implements SystemConfig {
  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  @Type(() => SystemConfigBackupsDto)
  @ValidateNested()
  @IsObject()
  backup!: SystemConfigBackupsDto;

  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  @Type(() => SystemConfigFFmpegDto)
  @ValidateNested()
  @IsObject()
  ffmpeg!: SystemConfigFFmpegDto;

  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  @Type(() => SystemConfigLoggingDto)
  @ValidateNested()
  @IsObject()
  logging!: SystemConfigLoggingDto;

  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  @Type(() => SystemConfigMachineLearningDto)
  @ValidateNested()
  @IsObject()
  machineLearning!: SystemConfigMachineLearningDto;

  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  @Type(() => SystemConfigMapDto)
  @ValidateNested()
  @IsObject()
  map!: SystemConfigMapDto;

  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  @Type(() => SystemConfigNewVersionCheckDto)
  @ValidateNested()
  @IsObject()
  newVersionCheck!: SystemConfigNewVersionCheckDto;

  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  @Type(() => SystemConfigNightlyTasksDto)
  @ValidateNested()
  @IsObject()
  nightlyTasks!: SystemConfigNightlyTasksDto;

  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  @Type(() => SystemConfigOAuthDto)
  @ValidateNested()
  @IsObject()
  oauth!: SystemConfigOAuthDto;

  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  @Type(() => SystemConfigPasswordLoginDto)
  @ValidateNested()
  @IsObject()
  passwordLogin!: SystemConfigPasswordLoginDto;

  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  @Type(() => SystemConfigReverseGeocodingDto)
  @ValidateNested()
  @IsObject()
  reverseGeocoding!: SystemConfigReverseGeocodingDto;

  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  @Type(() => SystemConfigMetadataDto)
  @ValidateNested()
  @IsObject()
  metadata!: SystemConfigMetadataDto;

  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  @Type(() => SystemConfigStorageTemplateDto)
  @ValidateNested()
  @IsObject()
  storageTemplate!: SystemConfigStorageTemplateDto;

  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  @Type(() => SystemConfigJobDto)
  @ValidateNested()
  @IsObject()
  job!: SystemConfigJobDto;

  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  @Type(() => SystemConfigImageDto)
  @ValidateNested()
  @IsObject()
  image!: SystemConfigImageDto;

  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  @Type(() => SystemConfigTrashDto)
  @ValidateNested()
  @IsObject()
  trash!: SystemConfigTrashDto;

  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  @Type(() => SystemConfigThemeDto)
  @ValidateNested()
  @IsObject()
  theme!: SystemConfigThemeDto;

  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  @Type(() => SystemConfigLibraryDto)
  @ValidateNested()
  @IsObject()
  library!: SystemConfigLibraryDto;

  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  @Type(() => SystemConfigNotificationsDto)
  @ValidateNested()
  @IsObject()
  notifications!: SystemConfigNotificationsDto;

  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  @Type(() => SystemConfigTemplatesDto)
  @ValidateNested()
  @IsObject()
  templates!: SystemConfigTemplatesDto;

  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  @Type(() => SystemConfigServerDto)
  @ValidateNested()
  @IsObject()
  server!: SystemConfigServerDto;

  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  @Type(() => SystemConfigUserDto)
  @ValidateNested()
  @IsObject()
  user!: SystemConfigUserDto;
}

export function mapConfig(config: SystemConfig): SystemConfigDto {
  return config;
}
