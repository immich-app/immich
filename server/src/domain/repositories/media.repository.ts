import { VideoCodec } from '@app/infra/entities';
import { Writable } from 'node:stream';

export const IMediaRepository = 'IMediaRepository';

export interface ResizeOptions {
  size: number;
  format: 'webp' | 'jpeg';
  colorspace: string;
  quality: number;
}

export interface VideoStreamInfo {
  index: number;
  height: number;
  width: number;
  rotation: number;
  codecName?: string;
  codecType?: string;
  frameCount: number;
  isHDR: boolean;
}

export interface AudioStreamInfo {
  index: number;
  codecName?: string;
  codecType?: string;
  frameCount: number;
}

export interface VideoFormat {
  formatName?: string;
  formatLongName?: string;
  duration: number;
  bitrate: number;
}

export interface VideoInfo {
  format: VideoFormat;
  videoStreams: VideoStreamInfo[];
  audioStreams: AudioStreamInfo[];
}

export interface CropOptions {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface TranscodeOptions {
  inputOptions: string[];
  outputOptions: string[];
  twoPass: boolean;
  ffmpegPath?: string;
  ldLibraryPath?: string;
}

export interface BitrateDistribution {
  max: number;
  target: number;
  min: number;
  unit: string;
}

export interface VideoCodecSWConfig {
  getOptions(videoStream: VideoStreamInfo, audioStream: AudioStreamInfo): TranscodeOptions;
}

export interface VideoCodecHWConfig extends VideoCodecSWConfig {
  getSupportedCodecs(): Array<VideoCodec>;
}

export interface IMediaRepository {
  // image
  resize(input: string | Buffer, output: string, options: ResizeOptions): Promise<void>;
  crop(input: string, options: CropOptions): Promise<Buffer>;
  generateThumbhash(imagePath: string): Promise<Buffer>;

  // video
  probe(input: string): Promise<VideoInfo>;
  transcode(input: string, output: string | Writable, options: TranscodeOptions): Promise<void>;
}
