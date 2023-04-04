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

export interface VideoInfo {
  streams: VideoStreamInfo[];
}

export interface IMediaRepository {
  // image
  extractThumbnailFromExif(input: string, output: string): Promise<void>;
  resize(input: string, output: string, options: ResizeOptions): Promise<void>;

  // video
  extractVideoThumbnail(input: string, output: string, size: number): Promise<void>;
  probe(input: string): Promise<VideoInfo>;
  transcode(input: string, output: string, options: any): Promise<void>;
}
