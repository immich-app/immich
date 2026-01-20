import { Injectable } from '@nestjs/common';
import { S3BucketOverride, SystemConfig } from 'src/config';
import { StorageCore } from 'src/cores/storage.core';
import { StorageBackend, StorageLocationType } from 'src/enum';
import { LocalStorageAdapter } from 'src/repositories/storage/local-storage.adapter';
import { S3StorageAdapter, S3StorageConfig } from 'src/repositories/storage/s3-storage.adapter';
import { IStorageAdapter } from 'src/repositories/storage/storage-adapter.interface';

/**
 * Factory for creating storage adapters based on configuration.
 * Manages adapter instances and provides the correct adapter for each storage location.
 * Supports per-media-type bucket overrides for multi-bucket S3 configurations.
 */
@Injectable()
export class StorageAdapterFactory {
  private localAdapter: LocalStorageAdapter | null = null;
  // Map of S3 adapters keyed by a unique config hash
  private s3Adapters: Map<string, S3StorageAdapter> = new Map();

  /**
   * Get the adapter for a specific storage location type based on config.
   */
  getAdapter(config: SystemConfig['storage'], locationType: StorageLocationType): IStorageAdapter {
    const backend = this.getBackendForLocation(config, locationType);

    if (backend === StorageBackend.S3) {
      return this.getS3AdapterForLocation(config, locationType);
    }

    return this.getLocalAdapter();
  }

  /**
   * Get adapter by backend type (uses default S3 config, no bucket override).
   */
  getAdapterByBackend(config: SystemConfig['storage'], backend: StorageBackend): IStorageAdapter {
    switch (backend) {
      case StorageBackend.S3: {
        return this.getS3Adapter(config.s3);
      }
      default: {
        return this.getLocalAdapter();
      }
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
   * Get S3 adapter for a specific storage location type.
   * Uses bucket override if configured, otherwise falls back to default.
   */
  getS3AdapterForLocation(
    config: SystemConfig['storage'],
    locationType: StorageLocationType,
  ): S3StorageAdapter {
    const s3Config = config.s3;

    if (!s3Config.enabled) {
      throw new Error('S3 storage is not enabled in configuration');
    }

    // Get the bucket override for this location type (if any)
    const bucketOverride = this.getBucketOverrideForLocation(s3Config, locationType);

    // Merge default config with bucket override
    const mergedConfig = this.mergeS3Config(s3Config, bucketOverride);

    // Create a unique key for this config combination
    const configKey = this.getConfigKey(mergedConfig);

    // Reuse existing adapter if config matches
    if (!this.s3Adapters.has(configKey)) {
      if (!mergedConfig.bucket) {
        throw new Error(`S3 bucket is required for location type: ${locationType}`);
      }

      this.s3Adapters.set(configKey, new S3StorageAdapter(mergedConfig));
    }

    return this.s3Adapters.get(configKey)!;
  }

  /**
   * Get the S3 adapter using default config (no bucket override).
   */
  getS3Adapter(s3Config: SystemConfig['storage']['s3']): S3StorageAdapter {
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

    const configKey = this.getConfigKey(config);

    if (!this.s3Adapters.has(configKey)) {
      this.s3Adapters.set(configKey, new S3StorageAdapter(config));
    }

    return this.s3Adapters.get(configKey)!;
  }

  /**
   * Get the bucket override configuration for a specific location type.
   */
  private getBucketOverrideForLocation(
    s3Config: SystemConfig['storage']['s3'],
    locationType: StorageLocationType,
  ): S3BucketOverride | undefined {
    const buckets = s3Config.buckets;
    if (!buckets) {
      return undefined;
    }

    switch (locationType) {
      case StorageLocationType.Originals:
        return buckets.originals;
      case StorageLocationType.Thumbnails:
        return buckets.thumbnails;
      case StorageLocationType.Previews:
        return buckets.previews;
      case StorageLocationType.EncodedVideos:
        return buckets.encodedVideos;
      case StorageLocationType.Profile:
        return buckets.profile;
      case StorageLocationType.Backups:
        return buckets.backups;
      default:
        return undefined;
    }
  }

  /**
   * Merge default S3 config with bucket-specific overrides.
   */
  private mergeS3Config(
    defaultConfig: SystemConfig['storage']['s3'],
    override?: S3BucketOverride,
  ): S3StorageConfig {
    return {
      endpoint: override?.endpoint ?? (defaultConfig.endpoint || undefined),
      region: override?.region ?? defaultConfig.region,
      bucket: override?.bucket ?? defaultConfig.bucket,
      accessKeyId: override?.accessKeyId ?? defaultConfig.accessKeyId,
      secretAccessKey: override?.secretAccessKey ?? defaultConfig.secretAccessKey,
      prefix: override?.prefix ?? defaultConfig.prefix,
      forcePathStyle: override?.forcePathStyle ?? defaultConfig.forcePathStyle,
    };
  }

  /**
   * Generate a unique key for an S3 config to enable adapter reuse.
   */
  private getConfigKey(config: S3StorageConfig): string {
    return `${config.endpoint ?? 'default'}:${config.bucket}:${config.accessKeyId}:${config.prefix ?? ''}`;
  }

  /**
   * Determine which backend to use for a given location type.
   */
  private getBackendForLocation(config: SystemConfig['storage'], locationType: StorageLocationType): StorageBackend {
    switch (locationType) {
      case StorageLocationType.Originals: {
        return config.locations.originals;
      }
      case StorageLocationType.Thumbnails: {
        return config.locations.thumbnails;
      }
      case StorageLocationType.Previews: {
        return config.locations.previews;
      }
      case StorageLocationType.EncodedVideos: {
        return config.locations.encodedVideos;
      }
      case StorageLocationType.Profile: {
        return config.locations.profile;
      }
      case StorageLocationType.Backups: {
        return config.locations.backups;
      }
      default: {
        return config.backend;
      }
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
        config.locations.encodedVideos === StorageBackend.S3 ||
        config.locations.profile === StorageBackend.S3 ||
        config.locations.backups === StorageBackend.S3)
    );
  }

  /**
   * Get the storage class for a specific location type.
   * First checks bucket override, then falls back to storageClasses config.
   */
  getStorageClassForLocation(
    s3Config: SystemConfig['storage']['s3'],
    locationType: StorageLocationType,
    assetType?: 'photo' | 'video',
  ): string | undefined {
    // First check bucket override
    const bucketOverride = this.getBucketOverrideForLocation(s3Config, locationType);
    if (bucketOverride?.storageClass) {
      return bucketOverride.storageClass;
    }

    // Fall back to storageClasses config
    const storageClasses = s3Config.storageClasses;
    switch (locationType) {
      case StorageLocationType.Originals:
        return assetType === 'video' ? storageClasses.originalsVideos : storageClasses.originalsPhotos;
      case StorageLocationType.Thumbnails:
        return storageClasses.thumbnails;
      case StorageLocationType.Previews:
        return storageClasses.previews;
      case StorageLocationType.EncodedVideos:
        return storageClasses.encodedVideos;
      default:
        return undefined;
    }
  }

  /**
   * Reset adapters (useful for testing or config changes).
   */
  reset(): void {
    this.localAdapter = null;
    this.s3Adapters.clear();
  }
}
