import { ReadStream } from 'fs';

export interface ImmichReadStream {
  stream: ReadStream;
  type: string;
  length: number;
}

export const IStorageRepository = 'IStorageRepository';

export interface IStorageRepository {
  createReadStream(filepath: string, mimeType: string): Promise<ImmichReadStream>;
}
