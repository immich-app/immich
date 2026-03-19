import { BadRequestException, Injectable } from '@nestjs/common';
import { Insertable } from 'kysely';
import { basename, join } from 'node:path';
import sanitize from 'sanitize-filename';
import { SystemConfig } from 'src/config';
import { SALT_ROUNDS } from 'src/constants';
import { StorageCore } from 'src/cores/storage.core';
import { UserAdmin } from 'src/database';
import { StorageBackend, StorageFolder } from 'src/enum';
import { AccessRepository } from 'src/repositories/access.repository';
import { ActivityRepository } from 'src/repositories/activity.repository';
import { AdminRecoveryKeyRepository } from 'src/repositories/admin-recovery-key.repository';
import { AlbumUserRepository } from 'src/repositories/album-user.repository';
import { AlbumRepository } from 'src/repositories/album.repository';
import { ApiKeyRepository } from 'src/repositories/api-key.repository';
import { AppRepository } from 'src/repositories/app.repository';
import { AssetEncryptionRepository } from 'src/repositories/asset-encryption.repository';
import { AssetJobRepository } from 'src/repositories/asset-job.repository';
import { AssetRepository } from 'src/repositories/asset.repository';
import { AuditRepository } from 'src/repositories/audit.repository';
import { ConfigRepository } from 'src/repositories/config.repository';
import { CronRepository } from 'src/repositories/cron.repository';
import { CryptoRepository } from 'src/repositories/crypto.repository';
import { DatabaseRepository } from 'src/repositories/database.repository';
import { DownloadRepository } from 'src/repositories/download.repository';
import { DuplicateRepository } from 'src/repositories/duplicate.repository';
import { EmailRepository } from 'src/repositories/email.repository';
import { EventRepository } from 'src/repositories/event.repository';
import { JobRepository } from 'src/repositories/job.repository';
import { LibraryRepository } from 'src/repositories/library.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { MachineLearningRepository } from 'src/repositories/machine-learning.repository';
import { MapRepository } from 'src/repositories/map.repository';
import { MediaRepository } from 'src/repositories/media.repository';
import { MemoryRepository } from 'src/repositories/memory.repository';
import { MetadataRepository } from 'src/repositories/metadata.repository';
import { MlStreamRepository } from 'src/repositories/ml-stream.repository';
import { MoveRepository } from 'src/repositories/move.repository';
import { NotificationRepository } from 'src/repositories/notification.repository';
import { OAuthRepository } from 'src/repositories/oauth.repository';
import { OcrRepository } from 'src/repositories/ocr.repository';
import { PartnerRepository } from 'src/repositories/partner.repository';
import { PersonRepository } from 'src/repositories/person.repository';
import { PluginRepository } from 'src/repositories/plugin.repository';
import { ProcessRepository } from 'src/repositories/process.repository';
import { SearchRepository } from 'src/repositories/search.repository';
import { ServerInfoRepository } from 'src/repositories/server-info.repository';
import { SessionRepository } from 'src/repositories/session.repository';
import { SharedLinkAssetRepository } from 'src/repositories/shared-link-asset.repository';
import { SharedLinkRepository } from 'src/repositories/shared-link.repository';
import { StackRepository } from 'src/repositories/stack.repository';
import { S3StorageManager } from 'src/repositories/storage';
import { StorageRepository } from 'src/repositories/storage.repository';
import { SyncCheckpointRepository } from 'src/repositories/sync-checkpoint.repository';
import { SyncRepository } from 'src/repositories/sync.repository';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository';
import { TagRepository } from 'src/repositories/tag.repository';
import { TelemetryRepository } from 'src/repositories/telemetry.repository';
import { TrashRepository } from 'src/repositories/trash.repository';
import { UserRepository } from 'src/repositories/user.repository';
import { VaultRepository } from 'src/repositories/vault.repository';
import { VersionHistoryRepository } from 'src/repositories/version-history.repository';
import { ViewRepository } from 'src/repositories/view-repository';
import { WebsocketRepository } from 'src/repositories/websocket.repository';
import { WorkflowRepository } from 'src/repositories/workflow.repository';
import { UserTable } from 'src/schema/tables/user.table';
import { AccessRequest, checkAccess, requireAccess } from 'src/utils/access';
import { getConfig, updateConfig } from 'src/utils/config';

export const BASE_SERVICE_DEPENDENCIES = [
  LoggingRepository,
  AccessRepository,
  ActivityRepository,
  AdminRecoveryKeyRepository,
  AlbumRepository,
  AlbumUserRepository,
  ApiKeyRepository,
  AppRepository,
  AssetRepository,
  AssetEncryptionRepository,
  AssetJobRepository,
  AuditRepository,
  ConfigRepository,
  CronRepository,
  CryptoRepository,
  DatabaseRepository,
  DownloadRepository,
  DuplicateRepository,
  EmailRepository,
  EventRepository,
  JobRepository,
  LibraryRepository,
  MachineLearningRepository,
  MapRepository,
  MlStreamRepository,
  MediaRepository,
  MemoryRepository,
  MetadataRepository,
  MoveRepository,
  NotificationRepository,
  OAuthRepository,
  OcrRepository,
  PartnerRepository,
  PersonRepository,
  PluginRepository,
  ProcessRepository,
  S3StorageManager,
  SearchRepository,
  ServerInfoRepository,
  SessionRepository,
  SharedLinkRepository,
  SharedLinkAssetRepository,
  StackRepository,
  StorageRepository,
  SyncRepository,
  SyncCheckpointRepository,
  SystemMetadataRepository,
  TagRepository,
  TelemetryRepository,
  TrashRepository,
  UserRepository,
  VaultRepository,
  VersionHistoryRepository,
  ViewRepository,
  WebsocketRepository,
  WorkflowRepository,
];

@Injectable()
export class BaseService {
  protected storageCore: StorageCore;

  constructor(
    protected logger: LoggingRepository,
    protected accessRepository: AccessRepository,
    protected activityRepository: ActivityRepository,
    protected adminRecoveryKeyRepository: AdminRecoveryKeyRepository,
    protected albumRepository: AlbumRepository,
    protected albumUserRepository: AlbumUserRepository,
    protected apiKeyRepository: ApiKeyRepository,
    protected appRepository: AppRepository,
    protected assetRepository: AssetRepository,
    protected assetEncryptionRepository: AssetEncryptionRepository,
    protected assetJobRepository: AssetJobRepository,
    protected auditRepository: AuditRepository,
    protected configRepository: ConfigRepository,
    protected cronRepository: CronRepository,
    protected cryptoRepository: CryptoRepository,
    protected databaseRepository: DatabaseRepository,
    protected downloadRepository: DownloadRepository,
    protected duplicateRepository: DuplicateRepository,
    protected emailRepository: EmailRepository,
    protected eventRepository: EventRepository,
    protected jobRepository: JobRepository,
    protected libraryRepository: LibraryRepository,
    protected machineLearningRepository: MachineLearningRepository,
    protected mapRepository: MapRepository,
    protected mediaRepository: MediaRepository,
    protected mlStreamRepository: MlStreamRepository,
    protected memoryRepository: MemoryRepository,
    protected metadataRepository: MetadataRepository,
    protected moveRepository: MoveRepository,
    protected notificationRepository: NotificationRepository,
    protected oauthRepository: OAuthRepository,
    protected ocrRepository: OcrRepository,
    protected partnerRepository: PartnerRepository,
    protected personRepository: PersonRepository,
    protected pluginRepository: PluginRepository,
    protected processRepository: ProcessRepository,
    protected s3Manager: S3StorageManager,
    protected searchRepository: SearchRepository,
    protected serverInfoRepository: ServerInfoRepository,
    protected sessionRepository: SessionRepository,
    protected sharedLinkRepository: SharedLinkRepository,
    protected sharedLinkAssetRepository: SharedLinkAssetRepository,
    protected stackRepository: StackRepository,
    protected storageRepository: StorageRepository,
    protected syncRepository: SyncRepository,
    protected syncCheckpointRepository: SyncCheckpointRepository,
    protected systemMetadataRepository: SystemMetadataRepository,
    protected tagRepository: TagRepository,
    protected telemetryRepository: TelemetryRepository,
    protected trashRepository: TrashRepository,
    protected userRepository: UserRepository,
    protected vaultRepository: VaultRepository,
    protected versionRepository: VersionHistoryRepository,
    protected viewRepository: ViewRepository,
    protected websocketRepository: WebsocketRepository,
    protected workflowRepository: WorkflowRepository,
  ) {
    this.logger.setContext(this.constructor.name);
    this.storageCore = StorageCore.create(
      assetRepository,
      configRepository,
      cryptoRepository,
      moveRepository,
      personRepository,
      storageRepository,
      systemMetadataRepository,
      this.logger,
    );
  }

  get worker() {
    return this.configRepository.getWorker();
  }

  private get configRepos() {
    return {
      configRepo: this.configRepository,
      metadataRepo: this.systemMetadataRepository,
      logger: this.logger,
    };
  }

  getConfig(options: { withCache: boolean }) {
    return getConfig(this.configRepos, options);
  }

  updateConfig(newConfig: SystemConfig) {
    return updateConfig(this.configRepos, newConfig);
  }

  requireAccess(request: AccessRequest) {
    return requireAccess(this.accessRepository, request);
  }

  checkAccess(request: AccessRequest) {
    return checkAccess(this.accessRepository, request);
  }

  async createUser(dto: Insertable<UserTable> & { email: string }): Promise<UserAdmin> {
    const exists = await this.userRepository.getByEmail(dto.email);
    if (exists) {
      throw new BadRequestException('User exists');
    }

    if (!dto.isAdmin) {
      const localAdmin = await this.userRepository.getAdmin();
      if (!localAdmin) {
        throw new BadRequestException('The first registered account must the administrator.');
      }
    }

    const payload: Insertable<UserTable> = { ...dto };
    if (payload.password) {
      payload.password = await this.cryptoRepository.hashBcrypt(payload.password, SALT_ROUNDS);
    }
    if (payload.storageLabel) {
      payload.storageLabel = sanitize(payload.storageLabel.replaceAll('.', ''));
    }

    const user = await this.userRepository.create(payload);

    await this.eventRepository.emit('UserCreate', user);

    return user;
  }

  /**
   * Ensure a file is available locally for processing.
   * If the file doesn't exist locally but is in S3, downloads it to a temp directory.
   * Also handles assets that are in S3 but missing S3 metadata in the database.
   * Returns whether the file was downloaded from S3 and the actual local path to use.
   */
  protected async ensureLocalFile(
    assetId: string,
    ownerId: string,
    originalPath: string,
    storageBackend: string | null,
    s3Bucket: string | null,
    s3Key: string | null,
    context: string,
  ): Promise<{ downloadedFromS3: boolean; localPath: string }> {
    // For S3 assets, originalPath is the S3 key - we need to download to a temp path
    // For local assets, originalPath is the actual local path
    const isS3Asset = storageBackend === StorageBackend.S3;

    if (!isS3Asset) {
      // Local asset - check if file exists at originalPath
      const localFileExists = await this.storageRepository.checkFileExists(originalPath);
      if (localFileExists) {
        return { downloadedFromS3: false, localPath: originalPath };
      }
    }

    // Generate temp path for S3 download
    const tempDir = join(StorageCore.getBaseFolder(StorageFolder.Upload), 'temp-recovery', assetId);
    const rawFilename = s3Key ? basename(s3Key) : basename(originalPath);
    // Sanitize filename for defense-in-depth (s3Key is system-generated, but be safe)
    const filename = rawFilename.replaceAll(/[^\w.-]/g, '_');
    const tempPath = join(tempDir, filename);

    // Check if we already downloaded this file (from a previous job in the same chain)
    if (await this.storageRepository.checkFileExists(tempPath)) {
      this.logger.debug(`Using existing temp file for asset ${assetId}: ${tempPath}`);
      return { downloadedFromS3: true, localPath: tempPath };
    }

    // Try to download from S3 if we have metadata
    if (isS3Asset && s3Bucket && s3Key) {
      this.logger.log(`Downloading asset ${assetId} from S3 for ${context}`);
      try {
        this.storageRepository.mkdirSync(tempDir);
        const s3Adapter = await this.s3Manager.getAdapterForBucket(s3Bucket);
        const { stream } = await s3Adapter.readStream(s3Key);
        await this.storageRepository.createFileFromStream(tempPath, stream);
        this.logger.debug(`Downloaded asset ${assetId} from S3 to ${tempPath}`);
        return { downloadedFromS3: true, localPath: tempPath };
      } catch (error) {
        this.logger.error(`Failed to download asset ${assetId} from S3: ${error}`);
        throw new Error(`Failed to download from S3 for ${context}: ${error}`);
      }
    }

    // Fallback: try to find file in S3 even without metadata (handles migration case)
    // Use isS3Enabled() instead of isS3EnabledForLocation() because files may have been
    // uploaded to S3 even if the current location config doesn't specify S3 for originals
    const s3Enabled = await this.s3Manager.isS3Enabled();
    this.logger.log(`S3 fallback check for asset ${assetId}: isS3Enabled=${s3Enabled}`);
    if (s3Enabled) {
      const generatedS3Key = this.generateFallbackS3Key(ownerId, assetId, originalPath);
      this.logger.debug(`S3 fallback: checking for asset ${assetId} at key ${generatedS3Key}`);

      try {
        // Use the default adapter which uses the archive bucket (where originals are stored)
        const s3Adapter = await this.s3Manager.getDefaultAdapter();
        const bucket = await this.s3Manager.getArchiveBucketName();
        const exists = await s3Adapter.exists(generatedS3Key);

        if (exists) {
          this.logger.log(`Found asset ${assetId} in S3 (missing metadata), downloading for ${context}`);
          this.storageRepository.mkdirSync(tempDir);
          const { stream } = await s3Adapter.readStream(generatedS3Key);
          await this.storageRepository.createFileFromStream(tempPath, stream);

          // Update asset with S3 metadata so future jobs don't need this fallback
          await this.assetRepository.update({
            id: assetId,
            storageBackend: StorageBackend.S3,
            s3Bucket: bucket,
            s3Key: generatedS3Key,
          });
          this.logger.debug(`Updated asset ${assetId} with S3 metadata and downloaded to ${tempPath}`);
          return { downloadedFromS3: true, localPath: tempPath };
        }
      } catch (error) {
        this.logger.warn(`S3 fallback check failed for asset ${assetId}: ${error}`);
        // Continue to throw "local file missing" error
      }
    }

    throw new Error(`Input file is missing: ${originalPath}`);
  }

  /**
   * Generate S3 key for an asset fallback lookup (same logic as s3-storage.service.ts)
   */
  private generateFallbackS3Key(userId: string, assetId: string, originalPath: string): string {
    const filename = originalPath.split('/').pop() || '';
    const lastDotIndex = filename.lastIndexOf('.');
    const ext = lastDotIndex > 0 ? filename.slice(Math.max(0, lastDotIndex + 1)) : '';
    const sanitizedExt = ext.replaceAll(/[^a-zA-Z0-9]/g, '');
    const safeExt = sanitizedExt || 'bin';
    return `users/${userId}/${assetId}/original.${safeExt}`;
  }

  /**
   * Ensure a preview/thumbnail file is available locally for ML processing.
   * If the file doesn't exist locally but is in S3, downloads it to a temp directory.
   * This is used by ML job handlers (SmartSearch, FaceDetection, OCR) that need
   * to read the preview file but may find it missing after a machine restart.
   */
  protected async ensurePreviewFile(
    assetId: string,
    previewFile: { path: string; storageBackend: string | null; s3Bucket: string | null; s3Key: string | null },
    context: string,
  ): Promise<{ downloadedFromS3: boolean; localPath: string }> {
    const { path, storageBackend, s3Bucket, s3Key } = previewFile;

    // Check if local file exists
    const localFileExists = await this.storageRepository.checkFileExists(path);
    if (localFileExists) {
      return { downloadedFromS3: false, localPath: path };
    }

    // Local file missing - try to download from S3 if we have metadata
    if (storageBackend === StorageBackend.S3 && s3Bucket && s3Key) {
      this.logger.log(`Preview file missing locally for asset ${assetId}, downloading from S3 for ${context}`);

      const tempDir = join(StorageCore.getBaseFolder(StorageFolder.Upload), 'temp-recovery', assetId);
      const rawFilename = basename(s3Key);
      const filename = rawFilename.replaceAll(/[^\w.-]/g, '_');
      const tempPath = join(tempDir, filename);

      // Check if we already downloaded this file
      if (await this.storageRepository.checkFileExists(tempPath)) {
        this.logger.debug(`Using existing temp preview file for asset ${assetId}: ${tempPath}`);
        return { downloadedFromS3: true, localPath: tempPath };
      }

      try {
        this.storageRepository.mkdirSync(tempDir);
        const s3Adapter = await this.s3Manager.getAdapterForBucket(s3Bucket);
        const { stream } = await s3Adapter.readStream(s3Key);
        await this.storageRepository.createFileFromStream(tempPath, stream);
        this.logger.debug(`Downloaded preview for asset ${assetId} from S3 to ${tempPath}`);
        return { downloadedFromS3: true, localPath: tempPath };
      } catch (error) {
        this.logger.error(`Failed to download preview for asset ${assetId} from S3: ${error}`);
        throw new Error(`Failed to download preview from S3 for ${context}: ${error}`);
      }
    }

    // No S3 info and local file missing - fail
    throw new Error(`Preview file missing for ${context}: ${path}`);
  }

  /**
   * Clean up a file that was downloaded from S3 for processing.
   * @param localPath The local file path to delete (as returned by ensureLocalFile)
   */
  protected async cleanupDownloadedFile(assetId: string, localPath: string, downloadedFromS3: boolean): Promise<void> {
    if (downloadedFromS3) {
      try {
        await this.storageRepository.unlink(localPath);
        this.logger.debug(`Cleaned up downloaded S3 file for asset ${assetId}`);
      } catch (error) {
        this.logger.warn(`Failed to clean up downloaded S3 file for asset ${assetId}: ${error}`);
      }
    }
  }
}
