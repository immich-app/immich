import { Injectable } from '@nestjs/common';
import { OnEvent } from 'src/decorators';
import { ImmichWorker } from 'src/enum';
import { ArgOf } from 'src/interfaces/event.interface';
import { IDeleteFilesJob, JobName } from 'src/interfaces/job.interface';
import { AssetService } from 'src/services/asset.service';
import { AuditService } from 'src/services/audit.service';
import { DuplicateService } from 'src/services/duplicate.service';
import { JobService } from 'src/services/job.service';
import { LibraryService } from 'src/services/library.service';
import { MediaService } from 'src/services/media.service';
import { MetadataService } from 'src/services/metadata.service';
import { NotificationService } from 'src/services/notification.service';
import { PersonService } from 'src/services/person.service';
import { SessionService } from 'src/services/session.service';
import { SmartInfoService } from 'src/services/smart-info.service';
import { StorageTemplateService } from 'src/services/storage-template.service';
import { StorageService } from 'src/services/storage.service';
import { TagService } from 'src/services/tag.service';
import { TrashService } from 'src/services/trash.service';
import { UserService } from 'src/services/user.service';
import { VersionService } from 'src/services/version.service';
import { otelShutdown } from 'src/utils/instrumentation';

@Injectable()
export class MicroservicesService {
  constructor(
    private auditService: AuditService,
    private assetService: AssetService,
    private jobService: JobService,
    private libraryService: LibraryService,
    private mediaService: MediaService,
    private metadataService: MetadataService,
    private notificationService: NotificationService,
    private personService: PersonService,
    private smartInfoService: SmartInfoService,
    private sessionService: SessionService,
    private storageTemplateService: StorageTemplateService,
    private storageService: StorageService,
    private tagService: TagService,
    private trashService: TrashService,
    private userService: UserService,
    private duplicateService: DuplicateService,
    private versionService: VersionService,
  ) {}

  @OnEvent({ name: 'app.bootstrap' })
  async onBootstrap(app: ArgOf<'app.bootstrap'>) {
    if (app !== ImmichWorker.MICROSERVICES) {
      return;
    }

    await this.jobService.init({
      [JobName.ASSET_DELETION]: (data) => this.assetService.handleAssetDeletion(data),
      [JobName.ASSET_DELETION_CHECK]: () => this.assetService.handleAssetDeletionCheck(),
      [JobName.DELETE_FILES]: (data: IDeleteFilesJob) => this.storageService.handleDeleteFiles(data),
      [JobName.CLEAN_OLD_AUDIT_LOGS]: () => this.auditService.handleCleanup(),
      [JobName.CLEAN_OLD_SESSION_TOKENS]: () => this.sessionService.handleCleanup(),
      [JobName.USER_DELETE_CHECK]: () => this.userService.handleUserDeleteCheck(),
      [JobName.USER_DELETION]: (data) => this.userService.handleUserDelete(data),
      [JobName.USER_SYNC_USAGE]: () => this.userService.handleUserSyncUsage(),
      [JobName.QUEUE_SMART_SEARCH]: (data) => this.smartInfoService.handleQueueEncodeClip(data),
      [JobName.SMART_SEARCH]: (data) => this.smartInfoService.handleEncodeClip(data),
      [JobName.QUEUE_DUPLICATE_DETECTION]: (data) => this.duplicateService.handleQueueSearchDuplicates(data),
      [JobName.DUPLICATE_DETECTION]: (data) => this.duplicateService.handleSearchDuplicates(data),
      [JobName.STORAGE_TEMPLATE_MIGRATION]: () => this.storageTemplateService.handleMigration(),
      [JobName.STORAGE_TEMPLATE_MIGRATION_SINGLE]: (data) => this.storageTemplateService.handleMigrationSingle(data),
      [JobName.QUEUE_MIGRATION]: () => this.mediaService.handleQueueMigration(),
      [JobName.MIGRATE_ASSET]: (data) => this.mediaService.handleAssetMigration(data),
      [JobName.MIGRATE_PERSON]: (data) => this.personService.handlePersonMigration(data),
      [JobName.QUEUE_GENERATE_THUMBNAILS]: (data) => this.mediaService.handleQueueGenerateThumbnails(data),
      [JobName.GENERATE_THUMBNAILS]: (data) => this.mediaService.handleGenerateThumbnails(data),
      [JobName.QUEUE_VIDEO_CONVERSION]: (data) => this.mediaService.handleQueueVideoConversion(data),
      [JobName.VIDEO_CONVERSION]: (data) => this.mediaService.handleVideoConversion(data),
      [JobName.QUEUE_METADATA_EXTRACTION]: (data) => this.metadataService.handleQueueMetadataExtraction(data),
      [JobName.METADATA_EXTRACTION]: (data) => this.metadataService.handleMetadataExtraction(data),
      [JobName.LINK_LIVE_PHOTOS]: (data) => this.metadataService.handleLivePhotoLinking(data),
      [JobName.QUEUE_FACE_DETECTION]: (data) => this.personService.handleQueueDetectFaces(data),
      [JobName.FACE_DETECTION]: (data) => this.personService.handleDetectFaces(data),
      [JobName.QUEUE_FACIAL_RECOGNITION]: (data) => this.personService.handleQueueRecognizeFaces(data),
      [JobName.FACIAL_RECOGNITION]: (data) => this.personService.handleRecognizeFaces(data),
      [JobName.GENERATE_PERSON_THUMBNAIL]: (data) => this.personService.handleGeneratePersonThumbnail(data),
      [JobName.PERSON_CLEANUP]: () => this.personService.handlePersonCleanup(),
      [JobName.QUEUE_SIDECAR]: (data) => this.metadataService.handleQueueSidecar(data),
      [JobName.SIDECAR_DISCOVERY]: (data) => this.metadataService.handleSidecarDiscovery(data),
      [JobName.SIDECAR_SYNC]: (data) => this.metadataService.handleSidecarSync(data),
      [JobName.SIDECAR_WRITE]: (data) => this.metadataService.handleSidecarWrite(data),
      [JobName.LIBRARY_QUEUE_SYNC_ALL]: () => this.libraryService.handleQueueSyncAll(),
      [JobName.LIBRARY_QUEUE_SYNC_FILES]: (data) => this.libraryService.handleQueueSyncFiles(data), //Queues all files paths on disk
      [JobName.LIBRARY_SYNC_FILE]: (data) => this.libraryService.handleSyncFile(data), //Handles a single path on disk //Watcher calls for new files
      [JobName.LIBRARY_QUEUE_SYNC_ASSETS]: (data) => this.libraryService.handleQueueSyncAssets(data), //Queues all library assets
      [JobName.LIBRARY_SYNC_ASSET]: (data) => this.libraryService.handleSyncAsset(data), //Handles all library assets // Watcher calls for unlink and changed
      [JobName.LIBRARY_DELETE]: (data) => this.libraryService.handleDeleteLibrary(data),
      [JobName.LIBRARY_QUEUE_CLEANUP]: () => this.libraryService.handleQueueCleanup(),
      [JobName.SEND_EMAIL]: (data) => this.notificationService.handleSendEmail(data),
      [JobName.NOTIFY_ALBUM_INVITE]: (data) => this.notificationService.handleAlbumInvite(data),
      [JobName.NOTIFY_ALBUM_UPDATE]: (data) => this.notificationService.handleAlbumUpdate(data),
      [JobName.NOTIFY_SIGNUP]: (data) => this.notificationService.handleUserSignup(data),
      [JobName.TAG_CLEANUP]: () => this.tagService.handleTagCleanup(),
      [JobName.VERSION_CHECK]: () => this.versionService.handleVersionCheck(),
      [JobName.QUEUE_TRASH_EMPTY]: () => this.trashService.handleQueueEmptyTrash(),
    });
  }

  async onShutdown() {
    await otelShutdown();
  }
}
