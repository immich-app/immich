import { BadRequestException, Injectable } from '@nestjs/common';
import { Insertable } from 'kysely';
import { createReadStream } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { isAbsolute, join } from 'node:path';
import sanitize from 'sanitize-filename';
import { SystemConfig } from 'src/config';
import { FACE_THUMBNAIL_SIZE, SALT_ROUNDS } from 'src/constants';
import { StorageCore } from 'src/cores/storage.core';
import { AssetFace, UserAdmin } from 'src/database';
import { AssetEditAction, type CropParameters } from 'src/dtos/editing.dto';
import { AssetFileType, CacheControl, ImageFormat, StorageFolder } from 'src/enum';
import { ServeStrategy } from 'src/interfaces/storage-backend.interface';
import { AccessRepository } from 'src/repositories/access.repository';
import { ActivityRepository } from 'src/repositories/activity.repository';
import { AlbumUserRepository } from 'src/repositories/album-user.repository';
import { AlbumRepository } from 'src/repositories/album.repository';
import { ApiKeyRepository } from 'src/repositories/api-key.repository';
import { AppRepository } from 'src/repositories/app.repository';
import { AssetEditRepository } from 'src/repositories/asset-edit.repository';
import { AssetJobRepository } from 'src/repositories/asset-job.repository';
import { AssetRepository } from 'src/repositories/asset.repository';
import { ClassificationRepository } from 'src/repositories/classification.repository';
import { ConfigRepository } from 'src/repositories/config.repository';
import { CronRepository } from 'src/repositories/cron.repository';
import { CryptoRepository } from 'src/repositories/crypto.repository';
import { DatabaseRepository } from 'src/repositories/database.repository';
import { DownloadRepository } from 'src/repositories/download.repository';
import { DuplicateRepository } from 'src/repositories/duplicate.repository';
import { EmailRepository } from 'src/repositories/email.repository';
import { EventRepository } from 'src/repositories/event.repository';
import { FaceIdentityRepository } from 'src/repositories/face-identity.repository';
import { JobRepository } from 'src/repositories/job.repository';
import { LibraryRepository } from 'src/repositories/library.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { MachineLearningRepository } from 'src/repositories/machine-learning.repository';
import { MapRepository } from 'src/repositories/map.repository';
import { MediaRepository } from 'src/repositories/media.repository';
import { MemoryRepository } from 'src/repositories/memory.repository';
import { MetadataRepository } from 'src/repositories/metadata.repository';
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
import { SharedSpaceRepository } from 'src/repositories/shared-space.repository';
import { StackRepository } from 'src/repositories/stack.repository';
import { StorageMigrationRepository } from 'src/repositories/storage-migration.repository';
import { StorageRepository } from 'src/repositories/storage.repository';
import { SyncCheckpointRepository } from 'src/repositories/sync-checkpoint.repository';
import { SyncRepository } from 'src/repositories/sync.repository';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository';
import { TagRepository } from 'src/repositories/tag.repository';
import { TelemetryRepository } from 'src/repositories/telemetry.repository';
import { TrashRepository } from 'src/repositories/trash.repository';
import { UserGroupRepository } from 'src/repositories/user-group.repository';
import { UserRepository } from 'src/repositories/user.repository';
import { VersionHistoryRepository } from 'src/repositories/version-history.repository';
import { ViewRepository } from 'src/repositories/view-repository';
import { WebsocketRepository } from 'src/repositories/websocket.repository';
import { WorkflowRepository } from 'src/repositories/workflow.repository';
import { UserTable } from 'src/schema/tables/user.table';
import { GenerateThumbnailOptions, ImageDimensions } from 'src/types';
import { AccessRequest, checkAccess, requireAccess } from 'src/utils/access';
import { getConfig, updateConfig } from 'src/utils/config';
import { ImmichFileResponse, ImmichMediaResponse, ImmichRedirectResponse, ImmichStreamResponse } from 'src/utils/file';
import { clamp } from 'src/utils/misc';

type FaceThumbnailBounds = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export const BASE_SERVICE_DEPENDENCIES = [
  LoggingRepository,
  AccessRepository,
  ActivityRepository,
  AlbumRepository,
  AlbumUserRepository,
  ApiKeyRepository,
  AppRepository,
  AssetRepository,
  AssetEditRepository,
  AssetJobRepository,
  ConfigRepository,
  ClassificationRepository,
  CronRepository,
  CryptoRepository,
  DatabaseRepository,
  DownloadRepository,
  DuplicateRepository,
  EmailRepository,
  EventRepository,
  FaceIdentityRepository,
  JobRepository,
  LibraryRepository,
  MachineLearningRepository,
  MapRepository,
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
  SearchRepository,
  ServerInfoRepository,
  SessionRepository,
  SharedLinkRepository,
  SharedLinkAssetRepository,
  SharedSpaceRepository,
  StackRepository,
  StorageMigrationRepository,
  StorageRepository,
  SyncRepository,
  SyncCheckpointRepository,
  SystemMetadataRepository,
  TagRepository,
  TelemetryRepository,
  TrashRepository,
  UserGroupRepository,
  UserRepository,
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
    protected albumRepository: AlbumRepository,
    protected albumUserRepository: AlbumUserRepository,
    protected apiKeyRepository: ApiKeyRepository,
    protected appRepository: AppRepository,
    protected assetRepository: AssetRepository,
    protected assetEditRepository: AssetEditRepository,
    protected assetJobRepository: AssetJobRepository,
    protected configRepository: ConfigRepository,
    protected classificationRepository: ClassificationRepository,
    protected cronRepository: CronRepository,
    protected cryptoRepository: CryptoRepository,
    protected databaseRepository: DatabaseRepository,
    protected downloadRepository: DownloadRepository,
    protected duplicateRepository: DuplicateRepository,
    protected emailRepository: EmailRepository,
    protected eventRepository: EventRepository,
    protected faceIdentityRepository: FaceIdentityRepository,
    protected jobRepository: JobRepository,
    protected libraryRepository: LibraryRepository,
    protected machineLearningRepository: MachineLearningRepository,
    protected mapRepository: MapRepository,
    protected mediaRepository: MediaRepository,
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
    protected searchRepository: SearchRepository,
    protected serverInfoRepository: ServerInfoRepository,
    protected sessionRepository: SessionRepository,
    protected sharedLinkRepository: SharedLinkRepository,
    protected sharedLinkAssetRepository: SharedLinkAssetRepository,
    protected sharedSpaceRepository: SharedSpaceRepository,
    protected stackRepository: StackRepository,
    protected storageMigrationRepository: StorageMigrationRepository,
    protected storageRepository: StorageRepository,
    protected syncRepository: SyncRepository,
    protected syncCheckpointRepository: SyncCheckpointRepository,
    protected systemMetadataRepository: SystemMetadataRepository,
    protected tagRepository: TagRepository,
    protected telemetryRepository: TelemetryRepository,
    protected trashRepository: TrashRepository,
    protected userGroupRepository: UserGroupRepository,
    protected userRepository: UserRepository,
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

  protected async serveFromBackend(
    filePath: string,
    contentType: string,
    cacheControl: CacheControl,
    fileName?: string,
  ): Promise<ImmichMediaResponse> {
    // lazy import to avoid circular dependency (StorageService extends BaseService)
    const { StorageService } = await import('./storage.service.js');
    const backend = StorageService.resolveBackendForKey(filePath);
    const strategy: ServeStrategy = await backend.getServeStrategy(filePath, contentType);

    switch (strategy.type) {
      case 'file': {
        return new ImmichFileResponse({
          path: strategy.path,
          contentType,
          cacheControl,
          fileName,
        });
      }
      case 'redirect': {
        return new ImmichRedirectResponse({
          url: strategy.url,
          cacheControl,
        });
      }
      case 'stream': {
        return new ImmichStreamResponse({
          stream: strategy.stream,
          contentType,
          length: strategy.length,
          cacheControl,
          fileName,
        });
      }
    }
  }

  /**
   * For assets on S3 backends, download to a local temp file for processing by
   * tools that require a filesystem path (ffmpeg, exiftool, sharp). Caller is
   * responsible for catching `downloadToTemp` errors or letting them propagate.
   *
   * @param filePath absolute disk path OR S3 relative key (anything that might
   *                 come from a DB column such as `asset.originalPath`).
   * @returns { localPath, cleanup } — cleanup is a no-op for disk paths and
   *          removes the temp file for S3-sourced paths. Always call cleanup
   *          in a `finally` block.
   */
  protected async ensureLocalFile(filePath: string): Promise<{ localPath: string; cleanup: () => Promise<void> }> {
    if (isAbsolute(filePath)) {
      return { localPath: filePath, cleanup: async () => {} };
    }
    // lazy import to avoid circular dependency (StorageService extends BaseService)
    const { StorageService } = await import('./storage.service.js');
    const backend = StorageService.resolveBackendForKey(filePath);
    const { tempPath, cleanup } = await backend.downloadToTemp(filePath);
    return { localPath: tempPath, cleanup };
  }

  protected async getFaceThumbnailSource(assetId: string): Promise<string | null> {
    const preview = await this.assetRepository.getForThumbnail(assetId, AssetFileType.Preview, false);
    if (preview.path) {
      return preview.path;
    }

    const thumbnail = await this.assetRepository.getForThumbnail(assetId, AssetFileType.Thumbnail, false);
    return thumbnail.path ?? null;
  }

  protected async generateFaceThumbnailResponse(face: AssetFace, sourcePath: string): Promise<ImmichMediaResponse> {
    const { image } = await this.getConfig({ withCache: true });
    const source = await this.ensureLocalFile(sourcePath);
    const tempDir = await mkdtemp(join(tmpdir(), 'gallery-face-thumbnail-'));
    const outputPath = join(tempDir, 'thumbnail.jpeg');

    try {
      const { data: decodedImage, info } = await this.mediaRepository.decodeImage(source.localPath, {
        colorspace: image.colorspace,
        processInvalidImages: process.env.IMMICH_PROCESS_INVALID_IMAGES === 'true',
      });

      const thumbnailOptions: GenerateThumbnailOptions = {
        colorspace: image.colorspace,
        format: ImageFormat.Jpeg,
        raw: info,
        quality: image.thumbnail.quality,
        progressive: false,
        processInvalidImages: false,
        size: FACE_THUMBNAIL_SIZE,
        edits: [
          {
            action: AssetEditAction.Crop,
            parameters: this.getFaceThumbnailCrop(
              {
                old: { width: face.imageWidth, height: face.imageHeight },
                new: { width: info.width, height: info.height },
              },
              {
                x1: face.boundingBoxX1,
                y1: face.boundingBoxY1,
                x2: face.boundingBoxX2,
                y2: face.boundingBoxY2,
              },
            ),
          },
        ],
      };

      await this.mediaRepository.generateThumbnail(decodedImage, thumbnailOptions, outputPath);
    } catch (error) {
      await rm(tempDir, { recursive: true, force: true });
      throw error;
    } finally {
      await source.cleanup();
    }

    const cleanup = () => {
      void rm(tempDir, { recursive: true, force: true }).catch(() => {});
    };
    const stream = createReadStream(outputPath);
    stream.once('close', cleanup);
    stream.once('error', cleanup);

    return new ImmichStreamResponse({
      stream,
      contentType: 'image/jpeg',
      cacheControl: CacheControl.PrivateWithoutCache,
    });
  }

  private getFaceThumbnailCrop(
    dims: { old: ImageDimensions; new: ImageDimensions },
    { x1, y1, x2, y2 }: FaceThumbnailBounds,
  ): CropParameters {
    if (
      !this.hasPositiveDimensions(dims.old) ||
      !this.hasPositiveDimensions(dims.new) ||
      ![x1, y1, x2, y2].every((value) => Number.isFinite(value)) ||
      x2 <= x1 ||
      y2 <= y1
    ) {
      return this.getCenteredFaceThumbnailCrop(dims.new);
    }

    const clampedX1 = clamp(x1, 0, dims.old.width);
    const clampedY1 = clamp(y1, 0, dims.old.height);
    const clampedX2 = clamp(x2, 0, dims.old.width);
    const clampedY2 = clamp(y2, 0, dims.old.height);

    const widthScale = dims.new.width / dims.old.width;
    const heightScale = dims.new.height / dims.old.height;

    const halfWidth = (widthScale * (clampedX2 - clampedX1)) / 2;
    const halfHeight = (heightScale * (clampedY2 - clampedY1)) / 2;

    const middleX = Math.round(widthScale * clampedX1 + halfWidth);
    const middleY = Math.round(heightScale * clampedY1 + halfHeight);
    const targetHalfSize = Math.floor(Math.max(halfWidth, halfHeight) * 1.1);
    const newHalfSize = Math.min(
      middleX - Math.max(0, middleX - targetHalfSize),
      middleY - Math.max(0, middleY - targetHalfSize),
      Math.min(dims.new.width - 1, middleX + targetHalfSize) - middleX,
      Math.min(dims.new.height - 1, middleY + targetHalfSize) - middleY,
    );

    const crop = {
      x: middleX - newHalfSize,
      y: middleY - newHalfSize,
      width: newHalfSize * 2,
      height: newHalfSize * 2,
    };

    return this.hasValidCrop(crop) ? crop : this.getCenteredFaceThumbnailCrop(dims.new);
  }

  private hasPositiveDimensions(dimensions: ImageDimensions) {
    return (
      Number.isFinite(dimensions.width) &&
      dimensions.width > 0 &&
      Number.isFinite(dimensions.height) &&
      dimensions.height > 0
    );
  }

  private hasValidCrop(crop: CropParameters) {
    return (
      Number.isFinite(crop.x) &&
      crop.x >= 0 &&
      Number.isFinite(crop.y) &&
      crop.y >= 0 &&
      Number.isFinite(crop.width) &&
      crop.width > 0 &&
      Number.isFinite(crop.height) &&
      crop.height > 0
    );
  }

  private getCenteredFaceThumbnailCrop(dimensions: ImageDimensions): CropParameters {
    const width = this.toPositiveInteger(dimensions.width, FACE_THUMBNAIL_SIZE);
    const height = this.toPositiveInteger(dimensions.height, FACE_THUMBNAIL_SIZE);
    const size = Math.min(width, height);

    return {
      x: Math.floor((width - size) / 2),
      y: Math.floor((height - size) / 2),
      width: size,
      height: size,
    };
  }

  private toPositiveInteger(value: number, fallback: number) {
    const rounded = Math.floor(value);
    return Number.isFinite(rounded) && rounded > 0 ? rounded : fallback;
  }

  protected async syncUsage(id?: string): Promise<void> {
    const users = id
      ? [await this.userRepository.get(id, { withDeleted: false })].filter((user): user is UserAdmin => !!user)
      : await this.userRepository.getList({ withDeleted: false });

    for (const user of users) {
      await this.userRepository.setUsage(user.id, await this.getPhysicalUsage(user));
    }
  }

  private async getPhysicalUsage(user: Pick<UserAdmin, 'id' | 'storageLabel'>): Promise<number> {
    let total = await this.getDiskUsage(user);

    // lazy import to avoid circular dependency (StorageService extends BaseService)
    const { StorageService } = await import('./storage.service.js');
    const s3 = StorageService.getS3Backend();
    if (s3) {
      const prefixes = [
        StorageFolder.Upload,
        StorageFolder.Profile,
        StorageFolder.Thumbnails,
        StorageFolder.EncodedVideo,
      ].map((folder) => `${folder}/${user.id}/`);
      const usage = await Promise.all(prefixes.map((prefix) => s3.getPrefixUsage(prefix)));
      total += usage.reduce((total, value) => total + value, 0);
    }

    return total;
  }

  private async getDiskUsage(user: Pick<UserAdmin, 'id' | 'storageLabel'>): Promise<number> {
    const folders = [
      StorageCore.getLibraryFolder(user),
      StorageCore.getFolderLocation(StorageFolder.Upload, user.id),
      StorageCore.getFolderLocation(StorageFolder.Profile, user.id),
      StorageCore.getFolderLocation(StorageFolder.Thumbnails, user.id),
      StorageCore.getFolderLocation(StorageFolder.EncodedVideo, user.id),
    ];
    const usage = await Promise.all(folders.map((folder) => this.storageRepository.getFolderSize(folder)));
    return usage.reduce((total, value) => total + value, 0);
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
}
