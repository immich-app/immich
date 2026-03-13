import { isAbsolute } from 'node:path';
import { StorageBackend } from 'src/interfaces/storage-backend.interface';

/**
 * Determines which backend owns a given path/key.
 * Absolute paths (starting with /) are disk assets (legacy).
 * Relative keys are S3 assets.
 */
export function resolveBackend(key: string, diskBackend: StorageBackend, s3Backend: StorageBackend): StorageBackend {
  if (isAbsolute(key)) {
    return diskBackend;
  }
  return s3Backend;
}
