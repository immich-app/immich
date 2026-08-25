import { createReadStream, createWriteStream } from 'node:fs';
import fs from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { StorageTargetKind } from 'src/enum';
import {
  assertSafeKey,
  DriverInput,
  joinKey,
  RemoteObject,
  RemoteStorageDriver,
  RemoteUploadOptions,
} from 'src/repositories/remote-storage/driver';

/**
 * A local or network-mounted directory used as an export/import destination.
 * Useful on its own (NFS/SMB shares) and as a dependency-free way to exercise the
 * transfer pipeline in tests.
 */
export class LocalDriver implements RemoteStorageDriver {
  private root: string;

  constructor({ config }: DriverInput<StorageTargetKind.Local>) {
    this.root = resolve(join(config.basePath, config.prefix));
  }

  private fullPath(key: string) {
    assertSafeKey(key);
    const path = resolve(join(this.root, joinKey(key)));
    // Belt and braces: even if a key slipped past assertSafeKey, refuse anything
    // that resolves outside the configured root.
    if (path !== this.root && !path.startsWith(this.root + sep)) {
      throw new Error(`Unsafe object key: ${key}`);
    }
    return path;
  }

  private toKey(path: string) {
    return relative(this.root, path).split(sep).join('/');
  }

  async test(): Promise<void> {
    await fs.mkdir(this.root, { recursive: true });
    const key = `.immich-connection-test-${Date.now()}`;
    await this.upload(key, Readable.from([Buffer.from('immich')]), { size: 6 });
    try {
      const object = await this.head(key);
      if (!object) {
        throw new Error('Wrote a test object but could not read it back');
      }
    } finally {
      await this.delete(key);
    }
  }

  async *list(prefix?: string): AsyncGenerator<RemoteObject[]> {
    const root = this.fullPath(prefix ?? '');

    const walk = async function* (directory: string): AsyncGenerator<string> {
      let entries;
      try {
        entries = await fs.readdir(directory, { withFileTypes: true });
      } catch (error: any) {
        if (error?.code === 'ENOENT') {
          return;
        }
        throw error;
      }

      for (const entry of entries) {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) {
          yield* walk(path);
        } else if (entry.isFile()) {
          yield path;
        }
      }
    };

    let batch: RemoteObject[] = [];
    for await (const path of walk(root)) {
      const stats = await fs.stat(path);
      batch.push({ key: this.toKey(path), size: stats.size, modifiedAt: stats.mtime });
      if (batch.length >= 1000) {
        yield batch;
        batch = [];
      }
    }

    if (batch.length > 0) {
      yield batch;
    }
  }

  async head(key: string): Promise<RemoteObject | null> {
    try {
      const stats = await fs.stat(this.fullPath(key));
      return { key, size: stats.size, modifiedAt: stats.mtime };
    } catch (error: any) {
      if (error?.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async createReadStream(key: string): Promise<Readable> {
    const path = this.fullPath(key);
    await fs.access(path);
    return createReadStream(path);
  }

  async upload(key: string, stream: Readable, options?: RemoteUploadOptions): Promise<RemoteObject> {
    const path = this.fullPath(key);
    await fs.mkdir(dirname(path), { recursive: true });
    await pipeline(stream, createWriteStream(path));
    const stats = await fs.stat(path);
    return { key, size: options?.size ?? stats.size };
  }

  async delete(key: string): Promise<void> {
    try {
      await fs.unlink(this.fullPath(key));
    } catch (error: any) {
      if (error?.code !== 'ENOENT') {
        throw error;
      }
    }
  }
}
