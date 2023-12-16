import {
  AssetService,
  AuditService,
  IDeleteFilesJob,
  JobName,
  JobService,
  LibraryService,
  MediaService,
  MetadataService,
  PersonService,
  SmartInfoService,
  StorageService,
  StorageTemplateService,
  SystemConfigService,
  UserService,
} from '@app/domain';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor(
    private auditService: AuditService,
    private assetService: AssetService,
    private configService: SystemConfigService,
    private jobService: JobService,
    private libraryService: LibraryService,
    private mediaService: MediaService,
    private metadataService: MetadataService,
    private personService: PersonService,
    private smartInfoService: SmartInfoService,
    private storageTemplateService: StorageTemplateService,
    private storageService: StorageService,
    private userService: UserService,
  ) {}

  async init() {
    await this.configService.init();
    await this.jobService.registerHandlers({
      [JobName.ASSET_DELETION]: (data) => this.assetService.handleAssetDeletion(data),
      [JobName.ASSET_DELETION_CHECK]: () => this.assetService.handleAssetDeletionCheck(),
      [JobName.DELETE_FILES]: (data: IDeleteFilesJob) => this.storageService.handleDeleteFiles(data),
      [JobName.CLEAN_OLD_AUDIT_LOGS]: () => this.auditService.handleCleanup(),
      [JobName.USER_DELETE_CHECK]: () => this.userService.handleUserDeleteCheck(),
      [JobName.USER_DELETION]: (data) => this.userService.handleUserDelete(data),
      [JobName.QUEUE_OBJECT_TAGGING]: (data) => this.smartInfoService.handleQueueObjectTagging(data),
      [JobName.CLASSIFY_IMAGE]: (data) => this.smartInfoService.handleClassifyImage(data),
      [JobName.QUEUE_ENCODE_CLIP]: (data) => this.smartInfoService.handleQueueEncodeClip(data),
      [JobName.ENCODE_CLIP]: (data) => this.smartInfoService.handleEncodeClip(data),
      [JobName.STORAGE_TEMPLATE_MIGRATION]: () => this.storageTemplateService.handleMigration(),
      [JobName.STORAGE_TEMPLATE_MIGRATION_SINGLE]: (data) => this.storageTemplateService.handleMigrationSingle(data),
      [JobName.QUEUE_MIGRATION]: () => this.mediaService.handleQueueMigration(),
      [JobName.MIGRATE_ASSET]: (data) => this.mediaService.handleAssetMigration(data),
      [JobName.MIGRATE_PERSON]: (data) => this.personService.handlePersonMigration(data),
      [JobName.QUEUE_GENERATE_THUMBNAILS]: (data) => this.mediaService.handleQueueGenerateThumbnails(data),
      [JobName.GENERATE_JPEG_THUMBNAIL]: (data) => this.mediaService.handleGenerateJpegThumbnail(data),
      [JobName.GENERATE_WEBP_THUMBNAIL]: (data) => this.mediaService.handleGenerateWebpThumbnail(data),
      [JobName.GENERATE_THUMBHASH_THUMBNAIL]: (data) => this.mediaService.handleGenerateThumbhashThumbnail(data),
      [JobName.QUEUE_VIDEO_CONVERSION]: (data) => this.mediaService.handleQueueVideoConversion(data),
      [JobName.VIDEO_CONVERSION]: (data) => this.mediaService.handleVideoConversion(data),
      [JobName.QUEUE_METADATA_EXTRACTION]: (data) => this.metadataService.handleQueueMetadataExtraction(data),
      [JobName.METADATA_EXTRACTION]: (data) => this.metadataService.handleMetadataExtraction(data),
      [JobName.LINK_LIVE_PHOTOS]: (data) => this.metadataService.handleLivePhotoLinking(data),
      [JobName.QUEUE_RECOGNIZE_FACES]: (data) => this.personService.handleQueueRecognizeFaces(data),
      [JobName.RECOGNIZE_FACES]: (data) => this.personService.handleRecognizeFaces(data),
      [JobName.GENERATE_PERSON_THUMBNAIL]: (data) => this.personService.handleGeneratePersonThumbnail(data),
      [JobName.PERSON_CLEANUP]: () => this.personService.handlePersonCleanup(),
      [JobName.PERSON_DELETE]: (data) => this.personService.handlePersonDelete(data),
      [JobName.QUEUE_SIDECAR]: (data) => this.metadataService.handleQueueSidecar(data),
      [JobName.SIDECAR_DISCOVERY]: (data) => this.metadataService.handleSidecarDiscovery(data),
      [JobName.SIDECAR_SYNC]: () => this.metadataService.handleSidecarSync(),
      [JobName.SIDECAR_WRITE]: (data) => this.metadataService.handleSidecarWrite(data),
      [JobName.LIBRARY_SCAN_ASSET]: (data) => this.libraryService.handleAssetRefresh(data),
      [JobName.LIBRARY_SCAN]: (data) => this.libraryService.handleQueueAssetRefresh(data),
      [JobName.LIBRARY_DELETE]: (data) => this.libraryService.handleDeleteLibrary(data),
      [JobName.LIBRARY_REMOVE_OFFLINE]: (data) => this.libraryService.handleOfflineRemoval(data),
      [JobName.LIBRARY_QUEUE_SCAN_ALL]: (data) => this.libraryService.handleQueueAllScan(data),
      [JobName.LIBRARY_QUEUE_CLEANUP]: () => this.libraryService.handleQueueCleanup(),
    });

    await this.metadataService.init();
  }

  async teardown() {
    await this.metadataService.teardown();
  }
}
