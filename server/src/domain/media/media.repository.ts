export const IMediaRepository = 'IMediaRepository';

export interface ResizeOptions {
  size: number;
  format: 'webp' | 'jpeg';
}

export interface VideoStreamInfo {
  height: number;
  width: number;
  rotation: number;
  codecName?: string;
  codecType?: string;
  frameCount: number;
}

export interface AudioStreamInfo {
  codecName?: string;
  codecType?: string;
}

export interface VideoFormat {
  formatName?: string;
  formatLongName?: string;
  duration: number;
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
  outputOptions: string[];
  twoPass: boolean;
}

export interface IMediaRepository {
  // image
  resize(input: string | Buffer, output: string, options: ResizeOptions): Promise<void>;
  crop(input: string, options: CropOptions): Promise<Buffer>;

  // video
  extractVideoThumbnail(input: string, output: string, size: number): Promise<void>;
  probe(input: string): Promise<VideoInfo>;
  transcode(input: string, output: string, options: TranscodeOptions): Promise<void>;
}
