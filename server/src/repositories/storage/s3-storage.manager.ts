import { Injectable } from '@nestjs/common';
import { S3BucketOverride, SystemConfig } from 'src/config';
import { AssetType, StorageBackend, StorageLocationType } from 'src/enum';
import { S3StorageAdapter, S3StorageConfig } from 'src/repositories/storage/s3-storage.adapter';

/**
 * Resolved S3 configuration for a specific storage location.
 * Contains the merged config (default + override) and derived values.
 */
export interface ResolvedS3Config {
  adapter: S3StorageAdapter;
  bucket: string;
  storageClass: string | undefined;
  prefix: string;
}

/**
 * S3 Storage Manager - centralizes multi-bucket S3 configuration logic.
 *
 * This manager handles:
 * - Selecting the correct S3 adapter for each storage location type
 * - Resolving bucket names (default vs override)
 * - Resolving storage classes (bucket override > storageClasses config)
 * - Caching adapters for reuse when configs match
 *
 * Usage:
 * ```typescript
 * const manager = new S3StorageManager(config.storage);
 * const { adapter, bucket, storageClass } = manager.getConfigForLocation(
 *   StorageLocationType.Originals,
 *   'video'
 * );
 * ```
 */
@Injectable()
export class S3StorageManager {
  // Cache adapters by unique config key to avoid creating duplicates
  private adapters: Map<string, S3StorageAdapter> = new Map();

  constructor(private config: SystemConfig['storage']) {}

  /**
   * Update the storage configuration.
   * Call this when system config changes.
   */
  updateConfig(config: SystemConfig['storage']): void {
    this.config = config;
    // Clear adapter cache on config change
    this.adapters.clear();
  }

  /**
   * Check if S3 is enabled globally.
   */
  isS3Enabled(): boolean {
    return this.config.s3.enabled;
  }

  /**
   * Check if S3 is enabled for a specific storage location.
   */
  isS3EnabledForLocation(locationType: StorageLocationType): boolean {
    if (!this.config.s3.enabled) {
      return false;
    }

    const locationBackend = this.getBackendForLocation(locationType);
    return locationBackend === StorageBackend.S3;
  }

  /**
   * Get the fully resolved S3 configuration for a storage location.
   * This is the main API for services to use.
   *
   * @param locationType - The type of storage location (originals, thumbnails, etc.)
   * @param assetType - Optional asset type for storage class selection (photo/video)
   * @returns Resolved config with adapter, bucket name, and storage class
   * @throws Error if S3 is not enabled for this location
   */
  getConfigForLocation(
    locationType: StorageLocationType,
    assetType?: AssetType,
  ): ResolvedS3Config {
    if (!this.isS3EnabledForLocation(locationType)) {
      throw new Error(`S3 is not enabled for location type: ${locationType}`);
    }

    const s3Config = this.config.s3;
    const bucketOverride = this.getBucketOverride(locationType);
    const mergedConfig = this.mergeConfig(s3Config, bucketOverride);

    return {
      adapter: this.getOrCreateAdapter(mergedConfig),
      bucket: mergedConfig.bucket,
      storageClass: this.resolveStorageClass(locationType, bucketOverride, assetType),
      prefix: mergedConfig.prefix || '',
    };
  }

  /**
   * Get just the S3 adapter for a location (convenience method).
   */
  getAdapterForLocation(locationType: StorageLocationType): S3StorageAdapter {
    return this.getConfigForLocation(locationType).adapter;
  }

  /**
   * Get just the bucket name for a location (for database records).
   */
  getBucketNameForLocation(locationType: StorageLocationType): string {
    if (!this.isS3EnabledForLocation(locationType)) {
      throw new Error(`S3 is not enabled for location type: ${locationType}`);
    }

    const bucketOverride = this.getBucketOverride(locationType);
    return bucketOverride?.bucket ?? this.config.s3.bucket;
  }

  /**
   * Get just the storage class for a location.
   */
  getStorageClassForLocation(
    locationType: StorageLocationType,
    assetType?: AssetType,
  ): string | undefined {
    const bucketOverride = this.getBucketOverride(locationType);
    return this.resolveStorageClass(locationType, bucketOverride, assetType);
  }

  /**
   * Get the default S3 adapter (uses base config, no overrides).
   * Useful for operations that don't have a specific location type.
   */
  getDefaultAdapter(): S3StorageAdapter {
    if (!this.config.s3.enabled) {
      throw new Error('S3 storage is not enabled');
    }

    const config: S3StorageConfig = {
      endpoint: this.config.s3.endpoint || undefined,
      region: this.config.s3.region,
      bucket: this.config.s3.bucket,
      accessKeyId: this.config.s3.accessKeyId,
      secretAccessKey: this.config.s3.secretAccessKey,
      prefix: this.config.s3.prefix,
      forcePathStyle: this.config.s3.forcePathStyle,
    };

    return this.getOrCreateAdapter(config);
  }

  /**
   * Get the backend type for a storage location.
   */
  private getBackendForLocation(locationType: StorageLocationType): StorageBackend {
    switch (locationType) {
      case StorageLocationType.Originals:
        return this.config.locations.originals;
      case StorageLocationType.Thumbnails:
        return this.config.locations.thumbnails;
      case StorageLocationType.Previews:
        return this.config.locations.previews;
      case StorageLocationType.EncodedVideos:
        return this.config.locations.encodedVideos;
      case StorageLocationType.Profile:
        return this.config.locations.profile;
      case StorageLocationType.Backups:
        return this.config.locations.backups;
      default:
        return this.config.backend;
    }
  }

  /**
   * Get the bucket override for a storage location (if configured).
   */
  private getBucketOverride(locationType: StorageLocationType): S3BucketOverride | undefined {
    const buckets = this.config.s3.buckets;
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
  private mergeConfig(
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
   * Resolve the storage class for a location.
   * Priority: bucket override > storageClasses config
   */
  private resolveStorageClass(
    locationType: StorageLocationType,
    bucketOverride?: S3BucketOverride,
    assetType?: AssetType,
  ): string | undefined {
    // First check bucket override
    if (bucketOverride?.storageClass) {
      return bucketOverride.storageClass;
    }

    // Fall back to storageClasses config
    const storageClasses = this.config.s3.storageClasses;
    switch (locationType) {
      case StorageLocationType.Originals:
        return assetType === AssetType.Video
          ? storageClasses.originalsVideos
          : storageClasses.originalsPhotos;
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
   * Get or create an S3 adapter for a config.
   * Caches adapters by unique config key for reuse.
   */
  private getOrCreateAdapter(config: S3StorageConfig): S3StorageAdapter {
    const key = this.getConfigKey(config);

    if (!this.adapters.has(key)) {
      if (!config.bucket) {
        throw new Error('S3 bucket is required');
      }
      this.adapters.set(key, new S3StorageAdapter(config));
    }

    return this.adapters.get(key)!;
  }

  /**
   * Generate a unique key for an S3 config to enable adapter caching.
   */
  private getConfigKey(config: S3StorageConfig): string {
    return `${config.endpoint ?? 'default'}|${config.bucket}|${config.accessKeyId}|${config.prefix ?? ''}`;
  }

  /**
   * Clear the adapter cache (useful for testing or config hot-reload).
   */
  reset(): void {
    this.adapters.clear();
  }
}
