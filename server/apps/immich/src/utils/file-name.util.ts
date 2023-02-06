import { basename, extname } from 'node:path';

export function getFileNameWithoutExtension(path: string): string {
  return basename(path, extname(path));
}
