import { Writable } from 'node:stream';
import { ImageFormat, TranscodeTarget, VideoCodec } from 'src/enum';

export const IMediaRepository = 'IMediaRepository';

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
  getCommand(target: TranscodeTarget, videoStream: VideoStreamInfo, audioStream: AudioStreamInfo): TranscodeCommand;
}

export interface VideoCodecHWConfig extends VideoCodecSWConfig {
  getSupportedCodecs(): Array<VideoCodec>;
}

export interface ProbeOptions {
  countFrames: boolean;
}

export interface IMediaRepository {
  // image
  extract(input: string, output: string): Promise<boolean>;
  decodeImage(input: string, options: DecodeToBufferOptions): Promise<ImageBuffer>;
  generateThumbnail(input: string, options: GenerateThumbnailOptions, outputFile: string): Promise<void>;
  generateThumbnail(input: Buffer, options: GenerateThumbnailFromBufferOptions, outputFile: string): Promise<void>;
  generateThumbhash(input: string, options: GenerateThumbhashOptions): Promise<Buffer>;
  generateThumbhash(input: Buffer, options: GenerateThumbhashFromBufferOptions): Promise<Buffer>;
  getImageDimensions(input: string): Promise<ImageDimensions>;

  // video
  probe(input: string, options?: ProbeOptions): Promise<VideoInfo>;
  transcode(input: string, output: string | Writable, command: TranscodeCommand): Promise<void>;
}
