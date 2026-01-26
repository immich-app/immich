import { Injectable } from '@nestjs/common';
import { StorageBackend, StorageLocationType } from 'src/enum';
import { BaseService } from 'src/services/base.service';

/**
 * PresignedUrlService - Synchronous URL Generation
 *
 * Responsibilities:
 * - Generate presigned download URLs for assets
 * - Generate presigned upload URLs for direct-to-S3 uploads
 *
 * When to use: API endpoints that need to return S3 URLs to clients.
 * These are synchronous calls, not queued jobs.
 */
@Injectable()
export class PresignedUrlService extends BaseService {
  // Maximum presigned URL expiration time (24 hours)
  private static readonly MAX_PRESIGNED_URL_EXPIRY = 86_400;

  // Maximum presigned download URL expiration time (7 days)
  private static readonly MAX_DOWNLOAD_URL_EXPIRY = 7 * 24 * 3600;

  // Allowed content types for presigned uploads (prevent XSS via HTML/JS uploads)
  private static readonly ALLOWED_UPLOAD_CONTENT_TYPES = new Set([
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif',
    'image/avif',
    'image/tiff',
    'image/bmp',
    'image/svg+xml',
    'image/x-adobe-dng',
    'image/x-canon-cr2',
    'image/x-canon-cr3',
    'image/x-nikon-nef',
    'image/x-sony-arw',
    'image/x-panasonic-rw2',
    'image/x-olympus-orf',
    'image/x-fuji-raf',
    // Videos
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
    'video/webm',
    'video/3gpp',
    'video/3gpp2',
    'video/x-m4v',
    'video/mpeg',
    'video/ogg',
    // Audio (for videos with audio tracks)
    'audio/mpeg',
    'audio/mp4',
    'audio/ogg',
    'audio/wav',
    'audio/webm',
  ]);

  /**
   * Validate content type for presigned uploads to prevent XSS attacks.
   */
  private isAllowedContentType(contentType: string): boolean {
    // Normalize content type (remove parameters like charset)
    const normalizedType = contentType.split(';')[0].trim().toLowerCase();
    return PresignedUrlService.ALLOWED_UPLOAD_CONTENT_TYPES.has(normalizedType);
  }

  /**
   * Get a presigned download URL for an S3 asset original.
   */
  async getPresignedDownloadUrl(assetId: string, expiresIn: number = 86_400): Promise<string | null> {
    const s3Manager = this.s3Manager;

    if (!(await s3Manager.isS3Enabled())) {
      return null;
    }

    const asset = await this.assetRepository.getById(assetId);
    if (!asset || asset.storageBackend !== StorageBackend.S3 || !asset.s3Key) {
      return null;
    }

    // Use the originals adapter (where the asset is stored)
    const { adapter: s3Adapter } = await s3Manager.getConfigForLocation(StorageLocationType.Originals);

    if (!s3Adapter.getPresignedDownloadUrl) {
      return null;
    }

    const safeExpiresIn = Math.min(expiresIn, PresignedUrlService.MAX_DOWNLOAD_URL_EXPIRY);
    return s3Adapter.getPresignedDownloadUrl(asset.s3Key, { expiresIn: safeExpiresIn });
  }

  /**
   * Get a presigned download URL for an encoded video in S3.
   */
  async getPresignedEncodedVideoUrl(assetId: string, expiresIn: number = 86_400): Promise<string | null> {
    const s3Manager = this.s3Manager;

    if (!(await s3Manager.isS3Enabled())) {
      return null;
    }

    const asset = await this.assetRepository.getById(assetId);
    if (!asset || !asset.s3KeyEncodedVideo) {
      return null;
    }

    // Use stored bucket if available, otherwise fall back to location config
    let s3Adapter;
    if (asset.s3BucketEncodedVideo) {
      s3Adapter = await s3Manager.getAdapterForBucket(asset.s3BucketEncodedVideo);
    } else {
      const config = await s3Manager.getConfigForLocation(StorageLocationType.EncodedVideos);
      s3Adapter = config.adapter;
    }

    if (!s3Adapter.getPresignedDownloadUrl) {
      return null;
    }

    const safeExpiresIn = Math.min(expiresIn, PresignedUrlService.MAX_DOWNLOAD_URL_EXPIRY);
    return s3Adapter.getPresignedDownloadUrl(asset.s3KeyEncodedVideo, { expiresIn: safeExpiresIn });
  }

  /**
   * Get a presigned download URL for a thumbnail or preview in S3.
   */
  async getPresignedThumbnailUrl(
    assetId: string,
    fileType: 'thumbnail' | 'preview',
    expiresIn: number = 86_400,
  ): Promise<string | null> {
    const s3Manager = this.s3Manager;

    if (!(await s3Manager.isS3Enabled())) {
      return null;
    }

    const asset = await this.assetRepository.getById(assetId, { files: true });
    if (!asset || !asset.files) {
      return null;
    }

    const file = asset.files.find(
      (f: { type: string; storageBackend?: StorageBackend; s3Key?: string | null }) =>
        f.type === fileType && f.storageBackend === StorageBackend.S3 && f.s3Key,
    );

    if (!file || !file.s3Key) {
      return null;
    }

    // Use the appropriate adapter based on file type
    const locationType = fileType === 'thumbnail' ? StorageLocationType.Thumbnails : StorageLocationType.Previews;
    const { adapter: s3Adapter } = await s3Manager.getConfigForLocation(locationType);

    if (!s3Adapter.getPresignedDownloadUrl) {
      return null;
    }

    const safeExpiresIn = Math.min(expiresIn, PresignedUrlService.MAX_DOWNLOAD_URL_EXPIRY);
    return s3Adapter.getPresignedDownloadUrl(file.s3Key, { expiresIn: safeExpiresIn });
  }

  /**
   * Get a presigned upload URL for direct client upload.
   */
  async getPresignedUploadUrl(
    userId: string,
    filename: string,
    contentType: string,
    expiresIn: number = 86_400,
  ): Promise<{ url: string; key: string } | null> {
    const config = await this.getConfig({ withCache: true });
    const s3Manager = this.s3Manager;

    if (!(await s3Manager.isS3Enabled()) || config.storage.upload.strategy !== 's3-first') {
      return null;
    }

    // Validate content type to prevent XSS attacks
    if (!this.isAllowedContentType(contentType)) {
      this.logger.warn(`Rejected presigned upload request with invalid content type: ${contentType}`);
      return null;
    }

    // Limit expiration time to prevent long-lived URLs
    const safeExpiresIn = Math.min(expiresIn, PresignedUrlService.MAX_PRESIGNED_URL_EXPIRY);

    // Use the originals adapter for uploads
    const { adapter: s3Adapter } = await s3Manager.getConfigForLocation(StorageLocationType.Originals);

    if (!s3Adapter.getPresignedUploadUrl) {
      return null;
    }

    // Generate a temporary upload key with proper extension extraction
    const uploadId = crypto.randomUUID();
    const lastDotIndex = filename.lastIndexOf('.');
    // Only treat as extension if dot is not at start (hidden files) and exists
    const ext = lastDotIndex > 0 ? filename.slice(Math.max(0, lastDotIndex + 1)) : '';
    const safeExt = ext || 'bin';
    const key = `uploads/${userId}/${uploadId}/original.${safeExt}`;

    const url = await s3Adapter.getPresignedUploadUrl(key, { expiresIn: safeExpiresIn, contentType });

    return { url, key };
  }
}
