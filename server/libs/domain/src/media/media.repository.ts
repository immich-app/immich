export const IMediaRepository = 'IMediaRepository';

export interface ResizeOptions {
  size: number;
  format: 'webp' | 'jpeg';
}

export interface IMediaRepository {
  resize(input: string, output: string, options: ResizeOptions): Promise<void>;
  extractVideoThumbnail(input: string, output: string): Promise<void>;
  extractThumbnailFromExif(input: string, output: string): Promise<void>;
}
