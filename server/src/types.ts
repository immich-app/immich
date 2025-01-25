import { UserEntity } from 'src/entities/user.entity';
import { ExifOrientation, ImageFormat, Permission, TranscodeTarget, VideoCodec } from 'src/enum';
import { AccessRepository } from 'src/repositories/access.repository';
import { ActivityRepository } from 'src/repositories/activity.repository';
import { AlbumUserRepository } from 'src/repositories/album-user.repository';
import { ApiKeyRepository } from 'src/repositories/api-key.repository';
import { AuditRepository } from 'src/repositories/audit.repository';
import { ConfigRepository } from 'src/repositories/config.repository';
import { CronRepository } from 'src/repositories/cron.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { MapRepository } from 'src/repositories/map.repository';
import { MediaRepository } from 'src/repositories/media.repository';
import { MemoryRepository } from 'src/repositories/memory.repository';
import { MetadataRepository } from 'src/repositories/metadata.repository';
import { NotificationRepository } from 'src/repositories/notification.repository';
import { OAuthRepository } from 'src/repositories/oauth.repository';
import { ServerInfoRepository } from 'src/repositories/server-info.repository';
import { MetricGroupRepository, TelemetryRepository } from 'src/repositories/telemetry.repository';
import { TrashRepository } from 'src/repositories/trash.repository';
import { VersionHistoryRepository } from 'src/repositories/version-history.repository';
import { ViewRepository } from 'src/repositories/view-repository';

export type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;

export type AuthApiKey = {
  id: string;
  key: string;
  user: UserEntity;
  permissions: Permission[];
};

export type RepositoryInterface<T extends object> = Pick<T, keyof T>;

export type IActivityRepository = RepositoryInterface<ActivityRepository>;
export type IAccessRepository = { [K in keyof AccessRepository]: RepositoryInterface<AccessRepository[K]> };
export type IAlbumUserRepository = RepositoryInterface<AlbumUserRepository>;
export type IApiKeyRepository = RepositoryInterface<ApiKeyRepository>;
export type IAuditRepository = RepositoryInterface<AuditRepository>;
export type IConfigRepository = RepositoryInterface<ConfigRepository>;
export type ICronRepository = RepositoryInterface<CronRepository>;
export type ILoggingRepository = Pick<
  LoggingRepository,
  | 'verbose'
  | 'log'
  | 'debug'
  | 'warn'
  | 'error'
  | 'fatal'
  | 'isLevelEnabled'
  | 'setLogLevel'
  | 'setContext'
  | 'setAppName'
>;
export type IMapRepository = RepositoryInterface<MapRepository>;
export type IMediaRepository = RepositoryInterface<MediaRepository>;
export type IMemoryRepository = RepositoryInterface<MemoryRepository>;
export type IMetadataRepository = RepositoryInterface<MetadataRepository>;
export type IMetricGroupRepository = RepositoryInterface<MetricGroupRepository>;
export type INotificationRepository = RepositoryInterface<NotificationRepository>;
export type IOAuthRepository = RepositoryInterface<OAuthRepository>;
export type IServerInfoRepository = RepositoryInterface<ServerInfoRepository>;
export type ITelemetryRepository = RepositoryInterface<TelemetryRepository>;
export type ITrashRepository = RepositoryInterface<TrashRepository>;
export type IViewRepository = RepositoryInterface<ViewRepository>;
export type IVersionHistoryRepository = RepositoryInterface<VersionHistoryRepository>;

export type ActivityItem =
  | Awaited<ReturnType<IActivityRepository['create']>>
  | Awaited<ReturnType<IActivityRepository['search']>>[0];

export type ApiKeyItem =
  | Awaited<ReturnType<IApiKeyRepository['create']>>
  | NonNullable<Awaited<ReturnType<IApiKeyRepository['getById']>>>
  | Awaited<ReturnType<IApiKeyRepository['getByUserId']>>[0];

export type MemoryItem =
  | Awaited<ReturnType<IMemoryRepository['create']>>
  | Awaited<ReturnType<IMemoryRepository['search']>>[0];

export interface CropOptions {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface ImageOptions {
  format: ImageFormat;
  quality: number;
  size: number;
}

export interface RawImageInfo {
  width: number;
  height: number;
  channels: 1 | 2 | 3 | 4;
}

interface DecodeImageOptions {
  colorspace: string;
  crop?: CropOptions;
  processInvalidImages: boolean;
  raw?: RawImageInfo;
}

export interface DecodeToBufferOptions extends DecodeImageOptions {
  size: number;
  orientation?: ExifOrientation;
}

export type GenerateThumbnailOptions = ImageOptions & DecodeImageOptions;

export type GenerateThumbnailFromBufferOptions = GenerateThumbnailOptions & { raw: RawImageInfo };

export type GenerateThumbhashOptions = DecodeImageOptions;

export type GenerateThumbhashFromBufferOptions = GenerateThumbhashOptions & { raw: RawImageInfo };

export interface GenerateThumbnailsOptions {
  colorspace: string;
  crop?: CropOptions;
  preview?: ImageOptions;
  processInvalidImages: boolean;
  thumbhash?: boolean;
  thumbnail?: ImageOptions;
}

export interface VideoStreamInfo {
  index: number;
  height: number;
  width: number;
  rotation: number;
  codecName?: string;
  frameCount: number;
  isHDR: boolean;
  bitrate: number;
  pixelFormat: string;
}

export interface AudioStreamInfo {
  index: number;
  codecName?: string;
  frameCount: number;
}

export interface VideoFormat {
  formatName?: string;
  formatLongName?: string;
  duration: number;
  bitrate: number;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface InputDimensions extends ImageDimensions {
  inputPath: string;
}

export interface VideoInfo {
  format: VideoFormat;
  videoStreams: VideoStreamInfo[];
  audioStreams: AudioStreamInfo[];
}

export interface TranscodeCommand {
  inputOptions: string[];
  outputOptions: string[];
  twoPass: boolean;
  progress: {
    frameCount: number;
    percentInterval: number;
  };
}

export interface BitrateDistribution {
  max: number;
  target: number;
  min: number;
  unit: string;
}

export interface ImageBuffer {
  data: Buffer;
  info: RawImageInfo;
}

export interface VideoCodecSWConfig {
  getCommand(
    target: TranscodeTarget,
    videoStream: VideoStreamInfo,
    audioStream: AudioStreamInfo,
    format?: VideoFormat,
  ): TranscodeCommand;
}

export interface VideoCodecHWConfig extends VideoCodecSWConfig {
  getSupportedCodecs(): Array<VideoCodec>;
}

export interface ProbeOptions {
  countFrames: boolean;
}

export interface VideoInterfaces {
  dri: string[];
  mali: boolean;
}
