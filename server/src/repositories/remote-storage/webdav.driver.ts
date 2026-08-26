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

const LOCK_RETRIES = 5;
const LOCK_RETRY_DELAY_MS = 250;

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
   *
   * Deliberately no exists() pre-check: concurrent exports all write under the
   * same owner folder, so a check-then-create would still race, and it costs an
   * extra round-trip per object. Creating unconditionally and accepting "it is
   * already there" is both correct and cheaper.
   */
  private async ensureDirectory(path: string) {
    const directory = path.slice(0, path.lastIndexOf('/'));
    if (!directory || directory === '/') {
      return;
    }

    // Each level is created in turn rather than leaning on the client's recursive
    // mode. Under concurrency a collision answers 405, and tolerating that for a
    // whole recursive call abandons every level beneath the one that collided --
    // the deepest collection is then missing and the upload answers 404. Creating
    // level by level keeps one worker's collision from cancelling another's work.
    const segments = directory.split('/').filter(Boolean);

    let current = '';
    for (const segment of segments) {
      current += `/${segment}`;
      await this.withLockRetry(() => this.createCollection(current));
    }
  }

  private async createCollection(path: string) {
    try {
      await this.client.createDirectory(path);
    } catch (error: any) {
      // Servers disagree on how to answer MKCOL for a collection that already
      // exists: 405 is the usual reply, Nextcloud sometimes says 403, and a race
      // can produce others. Rather than keep a list of codes that mean "fine",
      // ask the only question that matters -- is the collection there now?
      if (await this.client.exists(path).catch(() => false)) {
        return;
      }

      throw error;
    }
  }

  /**
   * Nextcloud briefly locks a collection while another request is writing into
   * it, answering everyone else with 423. It clears on its own, so a locked
   * response is worth waiting out rather than failing the asset.
   */
  private async withLockRetry<T>(operation: () => Promise<T>): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        if (error?.status !== 423 || attempt >= LOCK_RETRIES) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, LOCK_RETRY_DELAY_MS * (attempt + 1)));
      }
    }
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
