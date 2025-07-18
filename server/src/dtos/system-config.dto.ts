import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Transform, Type } from 'class-transformer';
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
import { PropertyLifecycle } from 'src/decorators';
import { CLIPConfig, DuplicateDetectionConfig, FacialRecognitionConfig } from 'src/dtos/model-config.dto';
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

class SystemConfigMachineLearningDto {
  @ValidateBoolean()
  enabled!: boolean;

  @PropertyLifecycle({ deprecatedAt: 'v1.122.0' })
  @Exclude()
  url?: string;

  @IsUrl({ require_tld: false, allow_underscores: true }, { each: true })
  @ArrayMinSize(1)
  @Transform(({ obj, value }) => (obj.url ? [obj.url] : value))
  @ValidateIf((dto) => dto.enabled)
  @ApiProperty({ type: 'array', items: { type: 'string', format: 'uri' }, minItems: 1 })
  urls!: string[];

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
  @ValidateBoolean()
  ignoreCert!: boolean;

  @IsNotEmpty()
  @IsString()
  host!: string;

  @IsNumber()
  @Min(0)
  @Max(65_535)
  port!: number;

  @IsString()
  username!: string;

  @IsString()
  password!: string;
}

export class SystemConfigSmtpDto {
  @ValidateBoolean()
  enabled!: boolean;

  @ValidateIf(isEmailNotificationEnabled)
  @IsNotEmpty()
  @IsString()
  @IsNotEmpty()
  from!: string;

  @IsString()
  replyTo!: string;

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

export class SystemConfigTemplateStorageOptionDto {
  yearOptions!: string[];
  monthOptions!: string[];
  weekOptions!: string[];
  dayOptions!: string[];
  hourOptions!: string[];
  minuteOptions!: string[];
  secondOptions!: string[];
  presetOptions!: string[];
}

export class SystemConfigThemeDto {
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

export class SystemConfigDto implements SystemConfig {
  @Type(() => SystemConfigBackupsDto)
  @ValidateNested()
  @IsObject()
  backup!: SystemConfigBackupsDto;

  @Type(() => SystemConfigFFmpegDto)
  @ValidateNested()
  @IsObject()
  ffmpeg!: SystemConfigFFmpegDto;

  @Type(() => SystemConfigLoggingDto)
  @ValidateNested()
  @IsObject()
  logging!: SystemConfigLoggingDto;

  @Type(() => SystemConfigMachineLearningDto)
  @ValidateNested()
  @IsObject()
  machineLearning!: SystemConfigMachineLearningDto;

  @Type(() => SystemConfigMapDto)
  @ValidateNested()
  @IsObject()
  map!: SystemConfigMapDto;

  @Type(() => SystemConfigNewVersionCheckDto)
  @ValidateNested()
  @IsObject()
  newVersionCheck!: SystemConfigNewVersionCheckDto;

  @Type(() => SystemConfigNightlyTasksDto)
  @ValidateNested()
  @IsObject()
  nightlyTasks!: SystemConfigNightlyTasksDto;

  @Type(() => SystemConfigOAuthDto)
  @ValidateNested()
  @IsObject()
  oauth!: SystemConfigOAuthDto;

  @Type(() => SystemConfigPasswordLoginDto)
  @ValidateNested()
  @IsObject()
  passwordLogin!: SystemConfigPasswordLoginDto;

  @Type(() => SystemConfigReverseGeocodingDto)
  @ValidateNested()
  @IsObject()
  reverseGeocoding!: SystemConfigReverseGeocodingDto;

  @Type(() => SystemConfigMetadataDto)
  @ValidateNested()
  @IsObject()
  metadata!: SystemConfigMetadataDto;

  @Type(() => SystemConfigStorageTemplateDto)
  @ValidateNested()
  @IsObject()
  storageTemplate!: SystemConfigStorageTemplateDto;

  @Type(() => SystemConfigJobDto)
  @ValidateNested()
  @IsObject()
  job!: SystemConfigJobDto;

  @Type(() => SystemConfigImageDto)
  @ValidateNested()
  @IsObject()
  image!: SystemConfigImageDto;

  @Type(() => SystemConfigTrashDto)
  @ValidateNested()
  @IsObject()
  trash!: SystemConfigTrashDto;

  @Type(() => SystemConfigThemeDto)
  @ValidateNested()
  @IsObject()
  theme!: SystemConfigThemeDto;

  @Type(() => SystemConfigLibraryDto)
  @ValidateNested()
  @IsObject()
  library!: SystemConfigLibraryDto;

  @Type(() => SystemConfigNotificationsDto)
  @ValidateNested()
  @IsObject()
  notifications!: SystemConfigNotificationsDto;

  @Type(() => SystemConfigTemplatesDto)
  @ValidateNested()
  @IsObject()
  templates!: SystemConfigTemplatesDto;

  @Type(() => SystemConfigServerDto)
  @ValidateNested()
  @IsObject()
  server!: SystemConfigServerDto;

  @Type(() => SystemConfigUserDto)
  @ValidateNested()
  @IsObject()
  user!: SystemConfigUserDto;
}

export function mapConfig(config: SystemConfig): SystemConfigDto {
  return config;
}
