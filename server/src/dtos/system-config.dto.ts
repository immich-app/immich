import { ApiProperty, ApiSchema } from '@nestjs/swagger';
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

@ApiSchema({ description: 'Database backup configuration with enabled flag, cron expression, and retention count' })
export class DatabaseBackupConfig {
  @ValidateBoolean()
  enabled!: boolean;

  @ValidateIf(isDatabaseBackupEnabled)
  @IsNotEmpty()
  @IsCronExpression()
  @IsString()
  cronExpression!: string;

  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  keepLastAmount!: number;
}

@ApiSchema({ description: 'System backup configuration with database settings' })
export class SystemConfigBackupsDto {
  @Type(() => DatabaseBackupConfig)
  @ValidateNested()
  @IsObject()
  database!: DatabaseBackupConfig;
}

@ApiSchema({
  description: 'FFmpeg configuration with video/audio codecs, encoding settings, and hardware acceleration',
})
export class SystemConfigFFmpegDto {
  @IsInt()
  @Min(0)
  @Max(51)
  @Type(() => Number)
  @ApiProperty({ type: 'integer' })
  crf!: number;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  @ApiProperty({ type: 'integer' })
  threads!: number;

  @IsString()
  preset!: string;

  @ValidateEnum({ enum: VideoCodec, name: 'VideoCodec' })
  targetVideoCodec!: VideoCodec;

  @ValidateEnum({ enum: VideoCodec, name: 'VideoCodec', each: true })
  acceptedVideoCodecs!: VideoCodec[];

  @ValidateEnum({ enum: AudioCodec, name: 'AudioCodec' })
  targetAudioCodec!: AudioCodec;

  @ValidateEnum({ enum: AudioCodec, name: 'AudioCodec', each: true })
  acceptedAudioCodecs!: AudioCodec[];

  @ValidateEnum({ enum: VideoContainer, name: 'VideoContainer', each: true })
  acceptedContainers!: VideoContainer[];

  @IsString()
  targetResolution!: string;

  @IsString()
  maxBitrate!: string;

  @IsInt()
  @Min(-1)
  @Max(16)
  @Type(() => Number)
  @ApiProperty({ type: 'integer' })
  bframes!: number;

  @IsInt()
  @Min(0)
  @Max(6)
  @Type(() => Number)
  @ApiProperty({ type: 'integer' })
  refs!: number;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  @ApiProperty({ type: 'integer' })
  gopSize!: number;

  @ValidateBoolean()
  temporalAQ!: boolean;

  @ValidateEnum({ enum: CQMode, name: 'CQMode' })
  cqMode!: CQMode;

  @ValidateBoolean()
  twoPass!: boolean;

  @IsString()
  preferredHwDevice!: string;

  @ValidateEnum({ enum: TranscodePolicy, name: 'TranscodePolicy' })
  transcode!: TranscodePolicy;

  @ValidateEnum({ enum: TranscodeHardwareAcceleration, name: 'TranscodeHWAccel' })
  accel!: TranscodeHardwareAcceleration;

  @ValidateBoolean()
  accelDecode!: boolean;

  @ValidateEnum({ enum: ToneMapping, name: 'ToneMapping' })
  tonemap!: ToneMapping;
}

class JobSettingsDto {
  @IsInt()
  @IsPositive()
  @ApiProperty({ type: 'integer' })
  concurrency!: number;
}

class SystemConfigJobDto implements Record<ConcurrentQueueName, JobSettingsDto> {
  @ApiProperty({ type: JobSettingsDto })
  @ValidateNested()
  @IsObject()
  @Type(() => JobSettingsDto)
  [QueueName.ThumbnailGeneration]!: JobSettingsDto;

  @ApiProperty({ type: JobSettingsDto })
  @ValidateNested()
  @IsObject()
  @Type(() => JobSettingsDto)
  [QueueName.MetadataExtraction]!: JobSettingsDto;

  @ApiProperty({ type: JobSettingsDto })
  @ValidateNested()
  @IsObject()
  @Type(() => JobSettingsDto)
  [QueueName.VideoConversion]!: JobSettingsDto;

  @ApiProperty({ type: JobSettingsDto })
  @ValidateNested()
  @IsObject()
  @Type(() => JobSettingsDto)
  [QueueName.SmartSearch]!: JobSettingsDto;

  @ApiProperty({ type: JobSettingsDto })
  @ValidateNested()
  @IsObject()
  @Type(() => JobSettingsDto)
  [QueueName.Migration]!: JobSettingsDto;

  @ApiProperty({ type: JobSettingsDto })
  @ValidateNested()
  @IsObject()
  @Type(() => JobSettingsDto)
  [QueueName.BackgroundTask]!: JobSettingsDto;

  @ApiProperty({ type: JobSettingsDto })
  @ValidateNested()
  @IsObject()
  @Type(() => JobSettingsDto)
  [QueueName.Search]!: JobSettingsDto;

  @ApiProperty({ type: JobSettingsDto })
  @ValidateNested()
  @IsObject()
  @Type(() => JobSettingsDto)
  [QueueName.FaceDetection]!: JobSettingsDto;

  @ApiProperty({ type: JobSettingsDto })
  @ValidateNested()
  @IsObject()
  @Type(() => JobSettingsDto)
  [QueueName.Ocr]!: JobSettingsDto;

  @ApiProperty({ type: JobSettingsDto })
  @ValidateNested()
  @IsObject()
  @Type(() => JobSettingsDto)
  [QueueName.Sidecar]!: JobSettingsDto;

  @ApiProperty({ type: JobSettingsDto })
  @ValidateNested()
  @IsObject()
  @Type(() => JobSettingsDto)
  [QueueName.Library]!: JobSettingsDto;

  @ApiProperty({ type: JobSettingsDto })
  @ValidateNested()
  @IsObject()
  @Type(() => JobSettingsDto)
  [QueueName.Notification]!: JobSettingsDto;

  @ApiProperty({ type: JobSettingsDto })
  @ValidateNested()
  @IsObject()
  @Type(() => JobSettingsDto)
  [QueueName.Workflow]!: JobSettingsDto;

  @ApiProperty({ type: JobSettingsDto })
  @ValidateNested()
  @IsObject()
  @Type(() => JobSettingsDto)
  [QueueName.Editor]!: JobSettingsDto;
}

class SystemConfigLibraryScanDto {
  @ValidateBoolean()
  enabled!: boolean;

  @ValidateIf(isLibraryScanEnabled)
  @IsNotEmpty()
  @IsCronExpression()
  @IsString()
  cronExpression!: string;
}

class SystemConfigLibraryWatchDto {
  @ValidateBoolean()
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
  @ValidateBoolean()
  enabled!: boolean;

  @ValidateEnum({ enum: LogLevel, name: 'LogLevel' })
  level!: LogLevel;
}

class MachineLearningAvailabilityChecksDto {
  @ValidateBoolean()
  enabled!: boolean;

  @IsInt()
  timeout!: number;

  @IsInt()
  interval!: number;
}

class SystemConfigMachineLearningDto {
  @ValidateBoolean()
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

@ApiSchema({ description: 'Map theme configuration with theme selection' })
export class MapThemeDto {
  @ValidateEnum({ enum: MapTheme, name: 'MapTheme' })
  theme!: MapTheme;
}

class SystemConfigMapDto {
  @ValidateBoolean()
  enabled!: boolean;

  @IsNotEmpty()
  @IsUrl()
  lightStyle!: string;

  @IsNotEmpty()
  @IsUrl()
  darkStyle!: string;
}

class SystemConfigNewVersionCheckDto {
  @ValidateBoolean()
  enabled!: boolean;
}

class SystemConfigNightlyTasksDto {
  @IsDateStringFormat('HH:mm', { message: 'startTime must be in HH:mm format' })
  startTime!: string;

  @ValidateBoolean()
  databaseCleanup!: boolean;

  @ValidateBoolean()
  missingThumbnails!: boolean;

  @ValidateBoolean()
  clusterNewFaces!: boolean;

  @ValidateBoolean()
  generateMemories!: boolean;

  @ValidateBoolean()
  syncQuotaUsage!: boolean;
}

class SystemConfigOAuthDto {
  @ValidateBoolean()
  autoLaunch!: boolean;

  @ValidateBoolean()
  autoRegister!: boolean;

  @IsString()
  buttonText!: string;

  @ValidateIf(isOAuthEnabled)
  @IsNotEmpty()
  @IsString()
  clientId!: string;

  @ValidateIf(isOAuthEnabled)
  @IsString()
  clientSecret!: string;

  @ValidateEnum({ enum: OAuthTokenEndpointAuthMethod, name: 'OAuthTokenEndpointAuthMethod' })
  tokenEndpointAuthMethod!: OAuthTokenEndpointAuthMethod;

  @IsInt()
  @IsPositive()
  @Optional()
  @ApiProperty({ type: 'integer' })
  timeout!: number;

  @IsNumber()
  @Min(0)
  @Optional({ nullable: true })
  @ApiProperty({ type: 'integer', format: 'int64' })
  defaultStorageQuota!: number | null;

  @ValidateBoolean()
  enabled!: boolean;

  @ValidateIf(isOAuthEnabled)
  @IsNotEmpty()
  @IsString()
  issuerUrl!: string;

  @ValidateBoolean()
  mobileOverrideEnabled!: boolean;

  @ValidateIf(isOAuthOverrideEnabled)
  @IsUrl()
  mobileRedirectUri!: string;

  @IsString()
  scope!: string;

  @IsString()
  @IsNotEmpty()
  signingAlgorithm!: string;

  @IsString()
  @IsNotEmpty()
  profileSigningAlgorithm!: string;

  @IsString()
  storageLabelClaim!: string;

  @IsString()
  storageQuotaClaim!: string;

  @IsString()
  roleClaim!: string;
}

class SystemConfigPasswordLoginDto {
  @ValidateBoolean()
  enabled!: boolean;
}

class SystemConfigReverseGeocodingDto {
  @ValidateBoolean()
  enabled!: boolean;
}

class SystemConfigFacesDto {
  @ValidateBoolean()
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
  externalDomain!: string;

  @IsString()
  loginPageMessage!: string;

  @ValidateBoolean()
  publicUsers!: boolean;
}

class SystemConfigSmtpTransportDto {
  @ApiProperty({ description: 'Whether to ignore SSL certificate errors', type: Boolean })
  @ValidateBoolean()
  ignoreCert!: boolean;

  @ApiProperty({ description: 'SMTP server hostname', type: String })
  @IsNotEmpty()
  @IsString()
  host!: string;

  @ApiProperty({ description: 'SMTP server port', type: Number, minimum: 0, maximum: 65_535 })
  @IsNumber()
  @Min(0)
  @Max(65_535)
  port!: number;

  @ApiProperty({ description: 'Whether to use secure connection (TLS/SSL)', type: Boolean })
  @ValidateBoolean()
  secure!: boolean;

  @ApiProperty({ description: 'SMTP username', type: String })
  @IsString()
  username!: string;

  @ApiProperty({ description: 'SMTP password', type: String })
  @IsString()
  password!: string;
}

@ApiSchema({
  description: 'SMTP email configuration with enabled flag, from/reply-to addresses, and transport settings',
})
export class SystemConfigSmtpDto {
  @ApiProperty({ description: 'Whether SMTP email notifications are enabled', type: Boolean })
  @ValidateBoolean()
  enabled!: boolean;

  @ApiProperty({ description: 'Email address to send from', type: String })
  @ValidateIf(isEmailNotificationEnabled)
  @IsNotEmpty()
  @IsString()
  @IsNotEmpty()
  from!: string;

  @ApiProperty({ description: 'Email address for replies', type: String })
  @IsString()
  replyTo!: string;

  @ApiProperty({ description: 'SMTP transport configuration', type: SystemConfigSmtpTransportDto })
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
  @ValidateBoolean()
  enabled!: boolean;

  @ValidateBoolean()
  hashVerificationEnabled!: boolean;

  @IsNotEmpty()
  @IsString()
  template!: string;
}

@ApiSchema({ description: 'Storage template format options for date/time components' })
export class SystemConfigTemplateStorageOptionDto {
  @ApiProperty({ description: 'Available year format options for storage template', type: [String] })
  yearOptions!: string[];
  @ApiProperty({ description: 'Available month format options for storage template', type: [String] })
  monthOptions!: string[];
  @ApiProperty({ description: 'Available week format options for storage template', type: [String] })
  weekOptions!: string[];
  @ApiProperty({ description: 'Available day format options for storage template', type: [String] })
  dayOptions!: string[];
  @ApiProperty({ description: 'Available hour format options for storage template', type: [String] })
  hourOptions!: string[];
  @ApiProperty({ description: 'Available minute format options for storage template', type: [String] })
  minuteOptions!: string[];
  @ApiProperty({ description: 'Available second format options for storage template', type: [String] })
  secondOptions!: string[];
  @ApiProperty({ description: 'Available preset template options', type: [String] })
  presetOptions!: string[];
}

@ApiSchema({ description: 'Theme configuration with custom CSS' })
export class SystemConfigThemeDto {
  @ApiProperty({ description: 'Custom CSS for theming', type: String })
  @IsString()
  customCss!: string;
}

class SystemConfigGeneratedImageDto {
  @ValidateEnum({ enum: ImageFormat, name: 'ImageFormat' })
  format!: ImageFormat;

  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @ApiProperty({ type: 'integer' })
  quality!: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  @ApiProperty({ type: 'integer' })
  size!: number;
}

class SystemConfigGeneratedFullsizeImageDto {
  @ValidateBoolean()
  enabled!: boolean;

  @ValidateEnum({ enum: ImageFormat, name: 'ImageFormat' })
  format!: ImageFormat;

  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @ApiProperty({ type: 'integer' })
  quality!: number;
}

@ApiSchema({
  description:
    'Image processing configuration with thumbnail, preview, fullsize settings, colorspace, and embedded extraction',
})
export class SystemConfigImageDto {
  @Type(() => SystemConfigGeneratedImageDto)
  @ValidateNested()
  @IsObject()
  thumbnail!: SystemConfigGeneratedImageDto;

  @Type(() => SystemConfigGeneratedImageDto)
  @ValidateNested()
  @IsObject()
  preview!: SystemConfigGeneratedImageDto;

  @Type(() => SystemConfigGeneratedFullsizeImageDto)
  @ValidateNested()
  @IsObject()
  fullsize!: SystemConfigGeneratedFullsizeImageDto;

  @ValidateEnum({ enum: Colorspace, name: 'Colorspace' })
  colorspace!: Colorspace;

  @ValidateBoolean()
  extractEmbedded!: boolean;
}

class SystemConfigTrashDto {
  @ValidateBoolean()
  enabled!: boolean;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  @ApiProperty({ type: 'integer' })
  days!: number;
}

class SystemConfigUserDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @ApiProperty({ type: 'integer' })
  deleteDelay!: number;
}

@ApiSchema({ description: 'System configuration response' })
export class SystemConfigDto implements SystemConfig {
  @ApiProperty({ description: 'Backup configuration', type: SystemConfigBackupsDto })
  @Type(() => SystemConfigBackupsDto)
  @ValidateNested()
  @IsObject()
  backup!: SystemConfigBackupsDto;

  @ApiProperty({ description: 'FFmpeg configuration', type: SystemConfigFFmpegDto })
  @Type(() => SystemConfigFFmpegDto)
  @ValidateNested()
  @IsObject()
  ffmpeg!: SystemConfigFFmpegDto;

  @ApiProperty({ description: 'Logging configuration', type: SystemConfigLoggingDto })
  @Type(() => SystemConfigLoggingDto)
  @ValidateNested()
  @IsObject()
  logging!: SystemConfigLoggingDto;

  @ApiProperty({ description: 'Machine learning configuration', type: SystemConfigMachineLearningDto })
  @Type(() => SystemConfigMachineLearningDto)
  @ValidateNested()
  @IsObject()
  machineLearning!: SystemConfigMachineLearningDto;

  @ApiProperty({ description: 'Map configuration', type: SystemConfigMapDto })
  @Type(() => SystemConfigMapDto)
  @ValidateNested()
  @IsObject()
  map!: SystemConfigMapDto;

  @ApiProperty({ description: 'New version check configuration', type: SystemConfigNewVersionCheckDto })
  @Type(() => SystemConfigNewVersionCheckDto)
  @ValidateNested()
  @IsObject()
  newVersionCheck!: SystemConfigNewVersionCheckDto;

  @ApiProperty({ description: 'Nightly tasks configuration', type: SystemConfigNightlyTasksDto })
  @Type(() => SystemConfigNightlyTasksDto)
  @ValidateNested()
  @IsObject()
  nightlyTasks!: SystemConfigNightlyTasksDto;

  @ApiProperty({ description: 'OAuth configuration', type: SystemConfigOAuthDto })
  @Type(() => SystemConfigOAuthDto)
  @ValidateNested()
  @IsObject()
  oauth!: SystemConfigOAuthDto;

  @ApiProperty({ description: 'Password login configuration', type: SystemConfigPasswordLoginDto })
  @Type(() => SystemConfigPasswordLoginDto)
  @ValidateNested()
  @IsObject()
  passwordLogin!: SystemConfigPasswordLoginDto;

  @ApiProperty({ description: 'Reverse geocoding configuration', type: SystemConfigReverseGeocodingDto })
  @Type(() => SystemConfigReverseGeocodingDto)
  @ValidateNested()
  @IsObject()
  reverseGeocoding!: SystemConfigReverseGeocodingDto;

  @ApiProperty({ description: 'Metadata configuration', type: SystemConfigMetadataDto })
  @Type(() => SystemConfigMetadataDto)
  @ValidateNested()
  @IsObject()
  metadata!: SystemConfigMetadataDto;

  @ApiProperty({ description: 'Storage template configuration', type: SystemConfigStorageTemplateDto })
  @Type(() => SystemConfigStorageTemplateDto)
  @ValidateNested()
  @IsObject()
  storageTemplate!: SystemConfigStorageTemplateDto;

  @ApiProperty({ description: 'Job queue configuration', type: SystemConfigJobDto })
  @Type(() => SystemConfigJobDto)
  @ValidateNested()
  @IsObject()
  job!: SystemConfigJobDto;

  @ApiProperty({ description: 'Image processing configuration', type: SystemConfigImageDto })
  @Type(() => SystemConfigImageDto)
  @ValidateNested()
  @IsObject()
  image!: SystemConfigImageDto;

  @ApiProperty({ description: 'Trash configuration', type: SystemConfigTrashDto })
  @Type(() => SystemConfigTrashDto)
  @ValidateNested()
  @IsObject()
  trash!: SystemConfigTrashDto;

  @ApiProperty({ description: 'Theme configuration', type: SystemConfigThemeDto })
  @Type(() => SystemConfigThemeDto)
  @ValidateNested()
  @IsObject()
  theme!: SystemConfigThemeDto;

  @ApiProperty({ description: 'Library configuration', type: SystemConfigLibraryDto })
  @Type(() => SystemConfigLibraryDto)
  @ValidateNested()
  @IsObject()
  library!: SystemConfigLibraryDto;

  @ApiProperty({ description: 'Notification configuration', type: SystemConfigNotificationsDto })
  @Type(() => SystemConfigNotificationsDto)
  @ValidateNested()
  @IsObject()
  notifications!: SystemConfigNotificationsDto;

  @ApiProperty({ description: 'Template configuration', type: SystemConfigTemplatesDto })
  @Type(() => SystemConfigTemplatesDto)
  @ValidateNested()
  @IsObject()
  templates!: SystemConfigTemplatesDto;

  @ApiProperty({ description: 'Server configuration', type: SystemConfigServerDto })
  @Type(() => SystemConfigServerDto)
  @ValidateNested()
  @IsObject()
  server!: SystemConfigServerDto;

  @ApiProperty({ description: 'User configuration', type: SystemConfigUserDto })
  @Type(() => SystemConfigUserDto)
  @ValidateNested()
  @IsObject()
  user!: SystemConfigUserDto;
}

export function mapConfig(config: SystemConfig): SystemConfigDto {
  return config;
}
