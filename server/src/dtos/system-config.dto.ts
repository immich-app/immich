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

class AutoStackWeightsDto {
  @IsInt() @Min(0) @Max(100) @Type(() => Number) size!: number;
  @IsInt() @Min(0) @Max(100) @Type(() => Number) timeSpan!: number;
  @IsInt() @Min(0) @Max(100) @Type(() => Number) continuity!: number;
  @IsInt() @Min(0) @Max(100) @Type(() => Number) visual!: number;
  @IsInt() @Min(0) @Max(100) @Type(() => Number) exposure!: number;
}

class SystemConfigAutoStackDto {
  @ValidateBoolean()
  @ApiProperty({ description: 'Enable automatic stack candidate generation' })
  enabled!: boolean;

  @IsInt()
  @Min(1)
  @Max(3600)
  @Type(() => Number)
  @ApiProperty({
    description: 'Time window (seconds) around a new asset for candidate grouping',
    minimum: 1,
    maximum: 3600,
  })
  windowSeconds!: number;

  @IsInt()
  @Min(1)
  @Max(3600)
  @Type(() => Number)
  @ApiProperty({
    description: 'Maximum gap (seconds) allowed between assets inside a temporal group',
    minimum: 1,
    maximum: 3600,
  })
  maxGapSeconds!: number;

  @IsInt()
  @Min(0)
  @Max(7200)
  @Optional()
  @Type(() => Number)
  @ApiProperty({
    required: false,
    description: 'Optional secondary extended window (seconds) for visual expansion / merging',
    minimum: 0,
    maximum: 7200,
  })
  extendedWindowSeconds?: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  @Optional()
  @Type(() => Number)
  @ApiProperty({
    required: false,
    description: 'Multiplier applied to maxGapSeconds when forming secondary visual groups',
    minimum: 1,
    maximum: 10,
  })
  relaxedGapMultiplier?: number;

  @IsInt()
  @Min(2)
  @Max(50)
  @Type(() => Number)
  @ApiProperty({ description: 'Minimum number of assets required to store a candidate', minimum: 2, maximum: 50 })
  minGroupSize!: number;

  @IsInt()
  @Min(1)
  @Max(1440)
  @Type(() => Number)
  @ApiProperty({
    description: 'Backfill look-back horizon in minutes for scheduled generation',
    minimum: 1,
    maximum: 1440,
  })
  horizonMinutes!: number;

  @ValidateBoolean()
  @ApiProperty({ description: 'Require matching camera make+model if metadata present' })
  cameraMatch!: boolean;

  @IsInt()
  @Min(10)
  @Max(1000)
  @Type(() => Number)
  @ApiProperty({ description: 'Maximum active candidate groups retained per user', minimum: 10, maximum: 1000 })
  maxCandidates!: number;

  @IsInt()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  @ApiProperty({
    description: 'Auto-promote when heuristic score >= this value (0 disables auto-promotion)',
    minimum: 0,
    maximum: 100,
  })
  autoPromoteMinScore!: number;
  @IsObject()
  @ValidateNested()
  @Type(() => AutoStackWeightsDto)
  @ApiProperty({ description: 'Scoring weights object' })
  weights!: AutoStackWeightsDto;

  @IsNumber()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  @ApiProperty({
    description: 'Cosine similarity threshold (0-1) for immediate promotion when embeddings present',
    minimum: 0,
    maximum: 1,
  })
  visualPromoteThreshold!: number;

  @IsNumber()
  @Min(0)
  @Optional()
  @ApiProperty({ required: false, description: 'Max temporal gap (s) to attempt merging adjacent groups', minimum: 0 })
  maxMergeGapSeconds?: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  @Optional()
  @ApiProperty({
    required: false,
    description: 'Visual bridge cosine threshold (0-1) to merge across a larger gap',
    minimum: 0,
    maximum: 1,
  })
  visualBridgeThreshold?: number;

  @IsNumber()
  @Min(0)
  @Optional()
  @ApiProperty({
    required: false,
    description: 'Minimum score improvement required to retain a merged group (0 = always merge)',
    minimum: 0,
  })
  mergeScoreDelta?: number;

  @ValidateBoolean()
  @Optional()
  @ApiProperty({ required: false, description: 'Enable outlier pruning that removes assets lowering visual cohesion' })
  outlierPruneEnabled?: boolean;

  @IsNumber()
  @Min(0)
  @Max(1)
  @Optional()
  @ApiProperty({
    required: false,
    description: 'Minimum delta improvement (0-1) in avg visual similarity to prune an outlier',
    minimum: 0,
    maximum: 1,
  })
  outlierPruneMinDelta?: number;

  @ValidateBoolean()
  @Optional()
  @ApiProperty({ required: false, description: 'Iteratively prune multiple outliers while improvement threshold met' })
  outlierPruneIterative?: boolean;

  @ValidateBoolean()
  @Optional()
  @ApiProperty({ required: false, description: 'Enable historical pHash backfill job' })
  pHashBackfillEnabled?: boolean;

  @IsInt()
  @Min(10)
  @Max(5000)
  @Optional()
  @ApiProperty({ required: false, description: 'Batch size for pHash backfill job', minimum: 10, maximum: 5000 })
  pHashBackfillBatchSize?: number;

  @IsInt()
  @Min(1)
  @Max(90)
  @Optional()
  @ApiProperty({
    required: false,
    description: 'Dismiss stale candidates older than this many days',
    minimum: 1,
    maximum: 90,
  })
  candidateAgingDays?: number;

  @IsInt()
  @Min(0)
  @Max(100)
  @Optional()
  @ApiProperty({
    required: false,
    description: 'Only age out candidates with score below this threshold',
    minimum: 0,
    maximum: 100,
  })
  candidateAgingScoreThreshold?: number;

  @IsInt()
  @Min(0)
  @Max(1800)
  @Optional()
  @ApiProperty({
    required: false,
    description: 'Secondary visual expansion window (seconds) to pull in near-duplicates',
    minimum: 0,
    maximum: 1800,
  })
  secondaryVisualWindowSeconds?: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  @Optional()
  @ApiProperty({
    required: false,
    description: 'Cosine similarity threshold (0-1) for adding external assets to a group',
    minimum: 0,
    maximum: 1,
  })
  visualGroupSimilarityThreshold?: number;

  @IsInt()
  @Min(0)
  @Max(64)
  @Optional()
  @ApiProperty({
    required: false,
    description: 'Maximum pHash Hamming distance to treat assets as near-duplicates',
    minimum: 0,
    maximum: 64,
  })
  pHashHammingThreshold?: number;

  @ValidateBoolean()
  @Optional()
  @ApiProperty({ required: false, description: 'Enable merging of overlapping groups (shared assets)' })
  overlapMergeEnabled?: boolean;

  @ValidateBoolean()
  @Optional()
  @ApiProperty({ required: false, description: 'Enable best-primary heuristic (pick sharpest/lowest ISO)' })
  bestPrimaryHeuristic?: boolean;

  @IsInt()
  @Min(0)
  @Max(100)
  @Optional()
  @ApiProperty({
    required: false,
    description: 'Maximum number of visually expanded assets to add per group',
    minimum: 0,
    maximum: 100,
  })
  secondaryVisualMaxAdds?: number;

  @ValidateBoolean()
  @Optional()
  @ApiProperty({ required: false, description: 'Offload heavy scoring to ML service if available' })
  mlOffloadEnabled?: boolean;

  // Session segmentation (split long temporal spans with low cohesion)
  @IsInt()
  @Min(5)
  @Max(86400)
  @Optional()
  @ApiProperty({
    required: false,
    description: 'Maximum span (seconds) allowed for a single group before segmentation considered',
    minimum: 5,
    maximum: 86400,
  })
  sessionMaxSpanSeconds?: number;
  @IsNumber()
  @Min(0)
  @Max(1)
  @Optional()
  @ApiProperty({
    required: false,
    description: 'Minimum average adjacent visual similarity (0-1) required to keep a long-span group intact',
    minimum: 0,
    maximum: 1,
  })
  sessionMinAvgAdjacency?: number;
  @IsInt()
  @Min(2)
  @Max(50)
  @Optional()
  @ApiProperty({
    required: false,
    description: 'Minimum segment size when splitting a session',
    minimum: 2,
    maximum: 50,
  })
  sessionMinSegmentSize?: number;

  // Hysteresis (sliding window) config
  @ValidateBoolean()
  @Optional()
  @ApiProperty({ required: false, description: 'Enable hysteresis dynamic thresholding' })
  hysteresisEnabled?: boolean;
  @IsInt()
  @Min(1)
  @Max(1440)
  @Optional()
  @ApiProperty({
    required: false,
    description: 'Sliding window size (minutes) for hysteresis candidate counting',
    minimum: 1,
    maximum: 1440,
  })
  hysteresisCandidateWindowMinutes?: number;
  @IsInt()
  @Min(1)
  @Max(10000)
  @Optional()
  @ApiProperty({
    required: false,
    description: 'Max candidates in window before raising threshold',
    minimum: 1,
    maximum: 10000,
  })
  hysteresisMaxCandidates?: number;
  @IsInt()
  @Min(1)
  @Max(100)
  @Optional()
  @ApiProperty({
    required: false,
    description: 'Base raise amount for autoPromoteMinScore when hysteresis triggers',
    minimum: 1,
    maximum: 100,
  })
  hysteresisRaiseScoreBy?: number;
}

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
  [QueueName.AutoStackCandidateQueueAll]!: JobSettingsDto;

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
  @ValidateIf((_: any, value: string) => value !== '')
  @IsUrl({ require_tld: false, require_protocol: true, protocols: ['http', 'https'] })
  externalDomain!: string;

  @IsString()
  loginPageMessage!: string;

  @ValidateBoolean()
  publicUsers!: boolean;

  @Type(() => SystemConfigAutoStackDto)
  @ValidateNested()
  @IsObject()
  autoStack!: SystemConfigAutoStackDto;
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

  @ValidateBoolean()
  secure!: boolean;

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
