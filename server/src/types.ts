import { UserEntity } from 'src/entities/user.entity';
import { ExifOrientation, ImageFormat, Permission, TranscodeTarget, VideoCodec } from 'src/enum';
import { ActivityRepository } from 'src/repositories/activity.repository';
import { ApiKeyRepository } from 'src/repositories/api-key.repository';
import { MemoryRepository } from 'src/repositories/memory.repository';
import { SessionRepository } from 'src/repositories/session.repository';

export type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;

export type AuthApiKey = {
  id: string;
  key: string;
  user: UserEntity;
  permissions: Permission[];
};

export type RepositoryInterface<T extends object> = Pick<T, keyof T>;

type IActivityRepository = RepositoryInterface<ActivityRepository>;
type IApiKeyRepository = RepositoryInterface<ApiKeyRepository>;
type IMemoryRepository = RepositoryInterface<MemoryRepository>;
type ISessionRepository = RepositoryInterface<SessionRepository>;

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

export type SessionItem = Awaited<ReturnType<ISessionRepository['getByUserId']>>[0];

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
