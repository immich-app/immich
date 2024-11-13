import { ChildProcessWithoutNullStreams, SpawnOptionsWithoutStdio } from 'node:child_process';
import { Readable } from 'node:stream';

export interface ImmichReadStream {
  stream: Readable;
  type?: string;
  length?: number;
}

export interface ImmichZipStream extends ImmichReadStream {
  addFile: (inputPath: string, filename: string) => void;
  finalize: () => Promise<void>;
}

export interface DiskUsage {
  available: number;
  free: number;
  total: number;
}

export const IProcessRepository = 'IProcessRepository';

export interface IProcessRepository {
  spawn(command: string, args?: readonly string[], options?: SpawnOptionsWithoutStdio): ChildProcessWithoutNullStreams;
}
