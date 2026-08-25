import { Readable } from 'node:stream';
import { StorageTargetKind } from 'src/enum';
import {
  assertSafeKey,
  DriverInput,
  joinKey,
  RemoteObject,
  RemoteStorageDriver,
  RemoteUploadOptions,
} from 'src/repositories/remote-storage/driver';
import { AuthType, createClient, FileStat, WebDAVClient } from 'webdav';

export class WebDavDriver implements RemoteStorageDriver {
  private client: WebDAVClient;
  private prefix: string;

  constructor({ config, secret }: DriverInput<StorageTargetKind.WebDav>) {
    this.prefix = config.prefix;
    this.client = createClient(config.baseUrl, {
      authType: AuthType.Password,
      username: secret.username,
      password: secret.password,
    });
  }

  private fullPath(key: string) {
    assertSafeKey(key);
    return '/' + joinKey(this.prefix, key);
  }

  private relativeKey(fullPath: string) {
    const prefix = joinKey(this.prefix);
    const trimmed = fullPath.replace(/^\/+/, '');
    return prefix ? trimmed.slice(prefix.length + 1) : trimmed;
  }

  /**
   * WebDAV has no implicit directory creation, so every intermediate collection
   * has to exist before a PUT. `recursive` does this in one call.
   */
  private async ensureDirectory(path: string) {
    const directory = path.slice(0, path.lastIndexOf('/'));
    if (!directory || directory === '/') {
      return;
    }
    if (await this.client.exists(directory)) {
      return;
    }
    await this.client.createDirectory(directory, { recursive: true });
  }

  async test(): Promise<void> {
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
    const root = '/' + joinKey(this.prefix, prefix);

    if (!(await this.client.exists(root))) {
      return;
    }

    // `deep` walks the whole subtree in a single PROPFIND, which is how Nextcloud
    // expects a full listing to be requested.
    const contents = (await this.client.getDirectoryContents(root, { deep: true })) as FileStat[];

    const objects = contents
      .filter((item) => item.type === 'file')
      .map((item) => ({
        key: this.relativeKey(decodeURIComponent(item.filename)),
        size: item.size ?? 0,
        etag: item.etag ?? undefined,
        modifiedAt: item.lastmod ? new Date(item.lastmod) : undefined,
      }));

    if (objects.length > 0) {
      yield objects;
    }
  }

  async head(key: string): Promise<RemoteObject | null> {
    try {
      const stat = (await this.client.stat(this.fullPath(key))) as FileStat;
      return {
        key,
        size: stat.size ?? 0,
        etag: stat.etag ?? undefined,
        modifiedAt: stat.lastmod ? new Date(stat.lastmod) : undefined,
      };
    } catch (error: any) {
      if (error?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  createReadStream(key: string): Promise<Readable> {
    return Promise.resolve(this.client.createReadStream(this.fullPath(key)));
  }

  async upload(key: string, stream: Readable, options?: RemoteUploadOptions): Promise<RemoteObject> {
    const path = this.fullPath(key);
    await this.ensureDirectory(path);

    await new Promise<void>((resolve, reject) => {
      // The write stream is a PassThrough feeding a PUT; it never emits 'finish'
      // for the request itself, so completion is only observable via the callback.
      const writeStream = this.client.createWriteStream(path, { overwrite: true }, () => resolve());
      writeStream.on('error', reject);
      stream.on('error', reject);
      stream.pipe(writeStream);
    });

    return { key, size: options?.size ?? 0 };
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.deleteFile(this.fullPath(key));
    } catch (error: any) {
      if (error?.status !== 404) {
        throw error;
      }
    }
  }
}
