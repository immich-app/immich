import { Injectable } from '@nestjs/common';
import { SystemConfig } from 'src/config';
import { StorageBackend, StorageLocationType } from 'src/enum';
import { StorageCore } from 'src/cores/storage.core';
import { IStorageAdapter } from './storage-adapter.interface';
import { LocalStorageAdapter } from './local-storage.adapter';
import { S3StorageAdapter, S3StorageConfig } from './s3-storage.adapter';

/**
 * Factory for creating storage adapters based on configuration.
 * Manages adapter instances and provides the correct adapter for each storage location.
 */
@Injectable()
export class StorageAdapterFactory {
  private localAdapter: LocalStorageAdapter | null = null;
  private s3Adapter: S3StorageAdapter | null = null;

  /**
   * Get the adapter for a specific storage location type based on config.
   */
  getAdapter(config: SystemConfig['storage'], locationType: StorageLocationType): IStorageAdapter {
    const backend = this.getBackendForLocation(config, locationType);
    return this.getAdapterByBackend(config, backend);
  }

  /**
   * Get adapter by backend type.
   */
  getAdapterByBackend(config: SystemConfig['storage'], backend: StorageBackend): IStorageAdapter {
    switch (backend) {
      case StorageBackend.S3:
        return this.getS3Adapter(config.s3);
      case StorageBackend.Local:
      default:
        return this.getLocalAdapter();
    }
  }

  /**
   * Get the local filesystem adapter.
   */
  getLocalAdapter(): LocalStorageAdapter {
    if (!this.localAdapter) {
      this.localAdapter = new LocalStorageAdapter(StorageCore.getMediaLocation());
    }
    return this.localAdapter;
  }

  /**
   * Get the S3 adapter, creating it if necessary.
   */
  getS3Adapter(s3Config: SystemConfig['storage']['s3']): S3StorageAdapter {
    if (!this.s3Adapter) {
      if (!s3Config.enabled) {
        throw new Error('S3 storage is not enabled in configuration');
      }

      if (!s3Config.bucket) {
        throw new Error('S3 bucket is required when S3 storage is enabled');
      }

      const config: S3StorageConfig = {
        endpoint: s3Config.endpoint || undefined,
        region: s3Config.region,
        bucket: s3Config.bucket,
        accessKeyId: s3Config.accessKeyId,
        secretAccessKey: s3Config.secretAccessKey,
        prefix: s3Config.prefix,
        forcePathStyle: s3Config.forcePathStyle,
      };

      this.s3Adapter = new S3StorageAdapter(config);
    }
    return this.s3Adapter;
  }

  /**
   * Determine which backend to use for a given location type.
   */
  private getBackendForLocation(
    config: SystemConfig['storage'],
    locationType: StorageLocationType,
  ): StorageBackend {
    switch (locationType) {
      case StorageLocationType.Originals:
        return config.locations.originals;
      case StorageLocationType.Thumbnails:
        return config.locations.thumbnails;
      case StorageLocationType.Previews:
        return config.locations.previews;
      case StorageLocationType.EncodedVideos:
        return config.locations.encodedVideos;
      default:
        return config.backend;
    }
  }

  /**
   * Check if S3 is enabled for any storage location.
   */
  isS3EnabledForAnyLocation(config: SystemConfig['storage']): boolean {
    return (
      config.s3.enabled &&
      (config.locations.originals === StorageBackend.S3 ||
        config.locations.thumbnails === StorageBackend.S3 ||
        config.locations.previews === StorageBackend.S3 ||
        config.locations.encodedVideos === StorageBackend.S3)
    );
  }

  /**
   * Reset adapters (useful for testing or config changes).
   */
  reset(): void {
    this.localAdapter = null;
    this.s3Adapter = null;
  }
}
