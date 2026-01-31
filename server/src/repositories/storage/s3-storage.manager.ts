import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { S3BucketConfig, SystemConfig } from 'src/config';
import { StorageCore } from 'src/cores/storage.core';
import { StorageBackend, StorageLocationType } from 'src/enum';
import { ConfigRepository } from 'src/repositories/config.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { LocalStorageAdapter } from 'src/repositories/storage/local-storage.adapter';
import { S3StorageAdapter, S3StorageConfig } from 'src/repositories/storage/s3-storage.adapter';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository';
import { getConfig } from 'src/utils/config';

/**
 * Resolved S3 configuration for a specific storage location.
 * Contains the merged config (default + bucket) and derived values.
 */
export interface ResolvedS3Config {
  adapter: S3StorageAdapter;
  bucket: string;
  storageClass: string | undefined;
  prefix: string;
}

/**
 * S3 Storage Manager - centralizes two-bucket S3 configuration logic.
 *
 * This manager handles:
 * - Selecting the correct S3 adapter for each storage location type
 * - Resolving bucket names (archive vs hot)
 * - Resolving storage classes (from bucket config)
 * - Caching adapters for reuse when configs match
 *
 * Two-bucket architecture:
 * - Archive bucket: For originals (Glacier IR)
 * - Hot bucket: For thumbnails, previews, encoded videos, profile, backups (STANDARD)
 *
 * Usage (via DI):
 * ```typescript
 * constructor(private s3Manager: S3StorageManager) {}
 *
 * async someMethod() {
 *   const { adapter, bucket, storageClass } = await this.s3Manager.getConfigForLocation(
 *     StorageLocationType.Originals
 *   );
 * }
 * ```
 */
@Injectable()
export class S3StorageManager {
  // Cache adapters by unique config key to avoid creating duplicates
  private adapters: Map<string, S3StorageAdapter> = new Map();
  private localAdapter: LocalStorageAdapter | null = null;
  private cachedConfig: SystemConfig['storage'] | null = null;

  constructor(
    private configRepository: ConfigRepository,
    private systemMetadataRepository: SystemMetadataRepository,
    private logger: LoggingRepository,
  ) {
    this.logger.setContext(S3StorageManager.name);
  }

  /**
   * Get the storage config, using cache when available.
   */
  private async getStorageConfig(): Promise<SystemConfig['storage']> {
    // Always fetch fresh config to ensure we have latest settings
    const config = await getConfig(
      { configRepo: this.configRepository, metadataRepo: this.systemMetadataRepository, logger: this.logger },
      { withCache: true },
    );

    // Clear adapter cache if config changed
    if (this.cachedConfig && JSON.stringify(this.cachedConfig) !== JSON.stringify(config.storage)) {
      this.adapters.clear();
    }

    this.cachedConfig = config.storage;
    return config.storage;
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
   * Check if S3 is enabled globally.
   */
  async isS3Enabled(): Promise<boolean> {
    const config = await this.getStorageConfig();
    return config.s3.enabled;
  }

  /**
   * Check if S3 is enabled for a specific storage location.
   */
  async isS3EnabledForLocation(locationType: StorageLocationType): Promise<boolean> {
    const config = await this.getStorageConfig();
    if (!config.s3.enabled) {
      return false;
    }

    const locationBackend = this.getBackendForLocation(config, locationType);
    return locationBackend === StorageBackend.S3;
  }

  /**
   * Get the fully resolved S3 configuration for a storage location.
   * This is the main API for services to use.
   *
   * @param locationType - The type of storage location (originals, thumbnails, etc.)
   * @returns Resolved config with adapter, bucket name, and storage class
   * @throws Error if S3 is not enabled for this location
   */
  async getConfigForLocation(locationType: StorageLocationType): Promise<ResolvedS3Config> {
    const config = await this.getStorageConfig();

    if (!config.s3.enabled) {
      throw new Error(`S3 is not enabled`);
    }

    const locationBackend = this.getBackendForLocation(config, locationType);
    if (locationBackend !== StorageBackend.S3) {
      throw new Error(`S3 is not enabled for location type: ${locationType}`);
    }

    const bucketConfig = this.getBucketConfig(config, locationType);
    const mergedConfig = this.mergeWithDefaults(config, bucketConfig);

    return {
      adapter: this.getOrCreateAdapter(mergedConfig),
      bucket: mergedConfig.bucket,
      storageClass: bucketConfig.storageClass,
      prefix: bucketConfig.prefix || '',
    };
  }

  /**
   * Get just the S3 adapter for a location (convenience method).
   */
  async getAdapterForLocation(locationType: StorageLocationType): Promise<S3StorageAdapter> {
    const resolved = await this.getConfigForLocation(locationType);
    return resolved.adapter;
  }

  /**
   * Get just the bucket name for a location (for database records).
   */
  async getBucketNameForLocation(locationType: StorageLocationType): Promise<string> {
    const config = await this.getStorageConfig();

    if (!config.s3.enabled) {
      throw new Error(`S3 is not enabled`);
    }

    const locationBackend = this.getBackendForLocation(config, locationType);
    if (locationBackend !== StorageBackend.S3) {
      throw new Error(`S3 is not enabled for location type: ${locationType}`);
    }

    const bucketConfig = this.getBucketConfig(config, locationType);
    return bucketConfig.bucket;
  }

  /**
   * Get just the storage class for a location.
   */
  async getStorageClassForLocation(locationType: StorageLocationType): Promise<string | undefined> {
    const config = await this.getStorageConfig();
    const bucketConfig = this.getBucketConfig(config, locationType);
    return bucketConfig.storageClass;
  }

  /**
   * Get the default S3 adapter (uses archive bucket config).
   * Useful for operations that don't have a specific location type.
   */
  async getDefaultAdapter(): Promise<S3StorageAdapter> {
    const config = await this.getStorageConfig();

    if (!config.s3.enabled) {
      throw new Error('S3 storage is not enabled');
    }

    const mergedConfig = this.mergeWithDefaults(config, config.s3.archiveBucket);
    return this.getOrCreateAdapter(mergedConfig);
  }

  /**
   * Get an S3 adapter for a specific bucket.
   * Uses the default S3 credentials but with the specified bucket.
   * Useful for deleting files from buckets that may differ from the default.
   */
  async getAdapterForBucket(bucket: string): Promise<S3StorageAdapter> {
    const config = await this.getStorageConfig();

    if (!config.s3.enabled) {
      throw new Error('S3 storage is not enabled');
    }

    // Determine which bucket config to use based on the bucket name
    let bucketConfig: S3BucketConfig | undefined;
    if (bucket === config.s3.archiveBucket.bucket) {
      bucketConfig = config.s3.archiveBucket;
    } else if (bucket === config.s3.hotBucket.bucket) {
      bucketConfig = config.s3.hotBucket;
    }

    // Use bucket-specific config if found, otherwise fall back to defaults
    const adapterConfig: S3StorageConfig = {
      endpoint: bucketConfig?.endpoint ?? (config.s3.endpoint || undefined),
      publicEndpoint: bucketConfig?.publicEndpoint ?? (config.s3.publicEndpoint || undefined),
      region: bucketConfig?.region ?? config.s3.region,
      bucket,
      accessKeyId: bucketConfig?.accessKeyId ?? config.s3.accessKeyId,
      secretAccessKey: bucketConfig?.secretAccessKey ?? config.s3.secretAccessKey,
      prefix: '', // No prefix for direct bucket access
      forcePathStyle: bucketConfig?.forcePathStyle ?? config.s3.forcePathStyle,
    };

    return this.getOrCreateAdapter(adapterConfig);
  }

  /**
   * Get the backend type for a storage location.
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
   * Get the bucket config for a storage location.
   * Uses two-bucket architecture:
   * - Archive bucket: For originals
   * - Hot bucket: For everything else (thumbnails, previews, encoded videos, profile, backups)
   */
  private getBucketConfig(config: SystemConfig['storage'], locationType: StorageLocationType): S3BucketConfig {
    switch (locationType) {
      case StorageLocationType.Originals: {
        return config.s3.archiveBucket;
      }
      default: {
        // Thumbnails, Previews, EncodedVideos, Profile, Backups
        return config.s3.hotBucket;
      }
    }
  }

  /**
   * Merge bucket config with default S3 credentials.
   */
  private mergeWithDefaults(config: SystemConfig['storage'], bucketConfig: S3BucketConfig): S3StorageConfig {
    return {
      endpoint: bucketConfig.endpoint ?? (config.s3.endpoint || undefined),
      publicEndpoint: bucketConfig.publicEndpoint ?? (config.s3.publicEndpoint || undefined),
      region: bucketConfig.region ?? config.s3.region,
      bucket: bucketConfig.bucket,
      accessKeyId: bucketConfig.accessKeyId ?? config.s3.accessKeyId,
      secretAccessKey: bucketConfig.secretAccessKey ?? config.s3.secretAccessKey,
      prefix: bucketConfig.prefix,
      forcePathStyle: bucketConfig.forcePathStyle ?? config.s3.forcePathStyle,
    };
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
   * Includes region to ensure adapters are not shared between different regions.
   * Credentials are hashed to prevent exposure in logs or error messages.
   */
  private getConfigKey(config: S3StorageConfig): string {
    const credHash = createHash('sha256')
      .update(config.accessKeyId + config.secretAccessKey)
      .digest('hex')
      .slice(0, 8);
    return `${config.endpoint ?? 'default'}|${config.region}|${config.bucket}|${credHash}|${config.prefix ?? ''}`;
  }

  /**
   * Clear the adapter cache (useful for testing or config hot-reload).
   */
  reset(): void {
    this.adapters.clear();
    this.cachedConfig = null;
  }
}
