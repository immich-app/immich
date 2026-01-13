import { createReadStream, createWriteStream, existsSync, mkdirSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Writable } from 'node:stream';
import {
  IStorageAdapter,
  StorageObjectInfo,
  StorageReadStream,
  StorageWriteOptions,
} from 'src/repositories/storage/storage-adapter.interface';

/**
 * Local filesystem storage adapter.
 * Wraps Node.js fs operations to implement the IStorageAdapter interface.
 */
export class LocalStorageAdapter implements IStorageAdapter {
  readonly name = 'local';

  constructor(private readonly basePath: string) {
    if (!path.isAbsolute(basePath)) {
      throw new Error(`LocalStorageAdapter basePath must be absolute: ${basePath}`);
    }
  }

  private resolvePath(key: string): string {
    // If key is already absolute and within basePath, use as-is
    if (path.isAbsolute(key)) {
      const resolved = path.resolve(key);
      if (resolved.startsWith(this.basePath)) {
        return resolved;
      }
      // Allow absolute paths outside basePath for compatibility
      return resolved;
    }
    // Otherwise, resolve relative to basePath
    return path.join(this.basePath, key);
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(this.resolvePath(key));
      return true;
    } catch {
      return false;
    }
  }

  async stat(key: string): Promise<StorageObjectInfo> {
    const stats = await fs.stat(this.resolvePath(key));
    return {
      size: stats.size,
      mtime: stats.mtime,
    };
  }

  async read(key: string): Promise<Buffer> {
    return fs.readFile(this.resolvePath(key));
  }

  async readStream(key: string): Promise<StorageReadStream> {
    const filePath = this.resolvePath(key);
    const stats = await fs.stat(filePath);
    return {
      stream: createReadStream(filePath),
      length: stats.size,
    };
  }

  async write(key: string, data: Buffer, _options?: StorageWriteOptions): Promise<void> {
    const filePath = this.resolvePath(key);
    await this.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, data);
  }

  writeStream(key: string, _options?: StorageWriteOptions): Writable {
    const filePath = this.resolvePath(key);
    // Ensure directory exists synchronously for stream creation
    const dir = path.dirname(filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    return createWriteStream(filePath);
  }

  async copy(sourceKey: string, targetKey: string): Promise<void> {
    const sourcePath = this.resolvePath(sourceKey);
    const targetPath = this.resolvePath(targetKey);
    await this.ensureDir(path.dirname(targetPath));
    await fs.copyFile(sourcePath, targetPath);
  }

  async move(sourceKey: string, targetKey: string): Promise<void> {
    const sourcePath = this.resolvePath(sourceKey);
    const targetPath = this.resolvePath(targetKey);
    await this.ensureDir(path.dirname(targetPath));

    try {
      // Try rename first (fast, same filesystem)
      await fs.rename(sourcePath, targetPath);
    } catch (error: any) {
      if (error.code === 'EXDEV') {
        // Cross-device move: copy then delete
        await fs.copyFile(sourcePath, targetPath);
        await fs.unlink(sourcePath);
      } else {
        throw error;
      }
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await fs.unlink(this.resolvePath(key));
    } catch (error: any) {
      // Ignore if file doesn't exist
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async ensureDir(dirPath: string): Promise<void> {
    const resolved = this.resolvePath(dirPath);
    if (!existsSync(resolved)) {
      await fs.mkdir(resolved, { recursive: true });
    }
  }

  // Local storage doesn't support presigned URLs
  getPresignedDownloadUrl?: undefined;
  getPresignedUploadUrl?: undefined;
  createMultipartUpload?: undefined;
  uploadPart?: undefined;
  completeMultipartUpload?: undefined;
  abortMultipartUpload?: undefined;
}
