import { Injectable } from '@nestjs/common';
import { Readable } from 'node:stream';
import { StorageTargetKind } from 'src/enum';
import { LoggingRepository } from 'src/repositories/logging.repository';
import {
  DriverInput,
  RemoteObject,
  RemoteStorageDriver,
  RemoteUploadOptions,
} from 'src/repositories/remote-storage/driver';
import { LocalDriver } from 'src/repositories/remote-storage/local.driver';
import { S3Driver } from 'src/repositories/remote-storage/s3.driver';
import { WebDavDriver } from 'src/repositories/remote-storage/webdav.driver';
import { StorageTargetConfig, StorageTargetSecret } from 'src/types';

export type StorageTargetRef = {
  id: string;
  /** Bumped on every edit, so it doubles as the cache-invalidation key. */
  updatedAt: Date | string;
  config: StorageTargetConfig;
  secret: StorageTargetSecret;
};

type CacheEntry = { key: string; driver: RemoteStorageDriver };

export const buildDriver = (config: StorageTargetConfig, secret: StorageTargetSecret): RemoteStorageDriver => {
  if (config.kind !== secret.kind) {
    throw new Error(`Storage target config kind (${config.kind}) does not match secret kind (${secret.kind})`);
  }

  switch (config.kind) {
    case StorageTargetKind.S3: {
      return new S3Driver({ config, secret } as DriverInput<StorageTargetKind.S3>);
    }
    case StorageTargetKind.WebDav: {
      return new WebDavDriver({ config, secret } as DriverInput<StorageTargetKind.WebDav>);
    }
    case StorageTargetKind.Local: {
      return new LocalDriver({ config, secret } as DriverInput<StorageTargetKind.Local>);
    }
    default: {
      throw new Error(`Unsupported storage target kind: ${(config as StorageTargetConfig).kind}`);
    }
  }
};

/**
 * Owns all I/O against external storage systems. Nothing above this layer knows
 * that S3 or WebDAV exist -- services only ever see relative object keys.
 */
@Injectable()
export class RemoteStorageRepository {
  private cache = new Map<string, CacheEntry>();

  constructor(private logger: LoggingRepository) {
    this.logger.setContext(RemoteStorageRepository.name);
  }

  private getDriver(target: StorageTargetRef): RemoteStorageDriver {
    const key = `${target.id}:${new Date(target.updatedAt).getTime()}`;
    const cached = this.cache.get(target.id);
    if (cached?.key === key) {
      return cached.driver;
    }

    const driver = buildDriver(target.config, target.secret);
    this.cache.set(target.id, { key, driver });
    return driver;
  }

  /** Drop a cached client, e.g. when the target is deleted. */
  evict(targetId: string) {
    this.cache.delete(targetId);
  }

  test(target: StorageTargetRef): Promise<void> {
    return this.getDriver(target).test();
  }

  list(target: StorageTargetRef, prefix?: string): AsyncGenerator<RemoteObject[]> {
    return this.getDriver(target).list(prefix);
  }

  head(target: StorageTargetRef, key: string): Promise<RemoteObject | null> {
    return this.getDriver(target).head(key);
  }

  createReadStream(target: StorageTargetRef, key: string): Promise<Readable> {
    return this.getDriver(target).createReadStream(key);
  }

  upload(
    target: StorageTargetRef,
    key: string,
    stream: Readable,
    options?: RemoteUploadOptions,
  ): Promise<RemoteObject> {
    return this.getDriver(target).upload(key, stream, options);
  }

  delete(target: StorageTargetRef, key: string): Promise<void> {
    return this.getDriver(target).delete(key);
  }
}
