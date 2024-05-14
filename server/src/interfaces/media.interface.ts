import { Writable } from 'node:stream';
import { ImageFormat, TranscodeTarget, VideoCodec } from 'src/config';

export const IMediaRepository = 'IMediaRepository';

export interface CropOptions {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface ThumbnailOptions {
  size: number;
  format: ImageFormat;
  colorspace: string;
  quality: number;
  crop?: CropOptions;
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

export interface VideoInfo {
  format: VideoFormat;
  videoStreams: VideoStreamInfo[];
  audioStreams: AudioStreamInfo[];
}

export interface TranscodeOptions {
  inputOptions: string[];
  outputOptions: string[];
  twoPass: boolean;
}

export interface BitrateDistribution {
  max: number;
  target: number;
  min: number;
  unit: string;
}

export interface VideoCodecSWConfig {
  getOptions(target: TranscodeTarget, videoStream: VideoStreamInfo, audioStream: AudioStreamInfo): TranscodeOptions;
}

export interface VideoCodecHWConfig extends VideoCodecSWConfig {
  getSupportedCodecs(): Array<VideoCodec>;
}

export interface IMediaRepository {
  // image
  extract(input: string, output: string): Promise<boolean>;
  generateThumbnail(input: string | Buffer, output: string, options: ThumbnailOptions): Promise<void>;
  generateThumbhash(imagePath: string): Promise<Buffer>;
  getImageDimensions(input: string): Promise<ImageDimensions>;

  // video
  probe(input: string): Promise<VideoInfo>;
  transcode(input: string, output: string | Writable, options: TranscodeOptions): Promise<void>;
}
