import { Writable } from 'node:stream';
import { ImageFormat, TranscodeTarget, VideoCodec } from 'src/enum';

export const IMediaRepository = 'IMediaRepository';

export interface CropOptions {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface ImageOutputConfig {
  format: ImageFormat;
  quality: number;
  size: number;
}

export interface ThumbnailOptions extends ImageOutputConfig {
  colorspace: string;
  crop?: CropOptions;
  processInvalidImages: boolean;
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
  generateThumbnail(input: string | Buffer, output: string, options: ThumbnailOptions): Promise<void>;
  generateThumbhash(imagePath: string): Promise<Buffer>;
  getImageDimensions(input: string): Promise<ImageDimensions>;

  // video
  probe(input: string, options?: ProbeOptions): Promise<VideoInfo>;
  transcode(input: string, output: string | Writable, command: TranscodeCommand): Promise<void>;
}
