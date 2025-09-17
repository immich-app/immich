import fs from 'node:fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { Readable, Writable } from 'node:stream';
import { AppStorageHead, AppStorageRange, IAppStorageBackend } from 'src/storage/app-storage.interface';

/**
 * Minimal local backend stub to satisfy the storage backend interface.
 * Not wired into the application yet (Phase 0 scaffolding).
 */
export class LocalAppStorageBackend implements IAppStorageBackend {
  constructor(private basePath: string) {}

  private toPath(key: string) {
    // Treat key as relative to base when not absolute.
    return key.startsWith('/') ? key : join(this.basePath, key);
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(this.toPath(key));
      return true;
    } catch {
      return false;
    }
  }

  async head(key: string): Promise<AppStorageHead> {
    const stat = await fs.stat(this.toPath(key));
    return { size: stat.size, lastModified: stat.mtime };
  }

  async readStream(key: string, range?: AppStorageRange): Promise<Readable> {
    const path = this.toPath(key);
    if (!range) return createReadStream(path);
    const start = range.start;
    const end = typeof range.end === 'number' ? range.end : undefined;
    return createReadStream(path, { start, end });
  }

  async writeStream(key: string): Promise<{ stream: Writable; done: () => Promise<void> }> {
    const path = this.toPath(key);
    await fs.mkdir(dirname(path), { recursive: true });
    const ws = createWriteStream(path);
    const done = () =>
      new Promise<void>((resolve, reject) => {
        ws.once('error', reject);
        ws.once('finish', () => resolve());
      });
    return { stream: ws, done };
  }

  async putObject(key: string, buffer: Buffer): Promise<void> {
    const path = this.toPath(key);
    await fs.mkdir(dirname(path), { recursive: true });
    await fs.writeFile(path, buffer);
  }

  async copyObject(srcKey: string, dstKey: string): Promise<void> {
    await fs.copyFile(this.toPath(srcKey), this.toPath(dstKey));
  }

  async moveObject(srcKey: string, dstKey: string): Promise<void> {
    // Try rename first, fallback to copy+unlink across devices
    try {
      await fs.rename(this.toPath(srcKey), this.toPath(dstKey));
    } catch (error: any) {
      if (error?.code !== 'EXDEV') throw error;
      await this.copyObject(srcKey, dstKey);
      await this.deleteObject(srcKey);
    }
  }

  async deleteObject(key: string): Promise<void> {
    try {
      await fs.unlink(this.toPath(key));
    } catch (error: any) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }

  async ensurePrefix(prefix: string): Promise<void> {
    await fs.mkdir(this.toPath(prefix || '.'), { recursive: true });
  }
}
