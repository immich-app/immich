import {
  AssetService,
  FacialRecognitionService,
  IAssetFaceJob,
  IAssetJob,
  IAssetUploadedJob,
  IBaseJob,
  IBulkEntityJob,
  IDeleteFilesJob,
  IFaceThumbnailJob,
  IUserDeletionJob,
  JobName,
  MediaService,
  PersonService,
  QueueName,
  SearchService,
  SmartInfoService,
  StorageService,
  StorageTemplateService,
  SystemConfigService,
  UserService,
} from '@app/domain';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

@Processor(QueueName.BACKGROUND_TASK)
export class BackgroundTaskProcessor {
  constructor(
    private assetService: AssetService,
    private personService: PersonService,
    private storageService: StorageService,
    private systemConfigService: SystemConfigService,
    private userService: UserService,
  ) {}

  @Process(JobName.ASSET_UPLOADED)
  async onAssetUpload(job: Job<IAssetUploadedJob>) {
    await this.assetService.handleAssetUpload(job.data);
  }

  @Process(JobName.DELETE_FILES)
  async onDeleteFile(job: Job<IDeleteFilesJob>) {
    await this.storageService.handleDeleteFiles(job.data);
  }

  @Process(JobName.SYSTEM_CONFIG_CHANGE)
  async onSystemConfigChange() {
    await this.systemConfigService.refreshConfig();
  }

  @Process(JobName.USER_DELETE_CHECK)
  async onUserDeleteCheck() {
    await this.userService.handleUserDeleteCheck();
  }

  @Process(JobName.USER_DELETION)
  async onUserDelete(job: Job<IUserDeletionJob>) {
    await this.userService.handleUserDelete(job.data);
  }

  @Process(JobName.PERSON_CLEANUP)
  async onPersonCleanup() {
    await this.personService.handlePersonCleanup();
  }
}

@Processor(QueueName.OBJECT_TAGGING)
export class ObjectTaggingProcessor {
  constructor(private smartInfoService: SmartInfoService) {}

  @Process({ name: JobName.QUEUE_OBJECT_TAGGING, concurrency: 0 })
  async onQueueObjectTagging(job: Job<IBaseJob>) {
    await this.smartInfoService.handleQueueObjectTagging(job.data);
  }

  @Process({ name: JobName.DETECT_OBJECTS, concurrency: 1 })
  async onDetectObjects(job: Job<IAssetJob>) {
    await this.smartInfoService.handleDetectObjects(job.data);
  }

  @Process({ name: JobName.CLASSIFY_IMAGE, concurrency: 1 })
  async onClassifyImage(job: Job<IAssetJob>) {
    await this.smartInfoService.handleClassifyImage(job.data);
  }
}

@Processor(QueueName.RECOGNIZE_FACES)
export class FacialRecognitionProcessor {
  constructor(private facialRecognitionService: FacialRecognitionService) {}

  @Process({ name: JobName.QUEUE_RECOGNIZE_FACES, concurrency: 0 })
  async onQueueRecognizeFaces(job: Job<IBaseJob>) {
    await this.facialRecognitionService.handleQueueRecognizeFaces(job.data);
  }

  @Process({ name: JobName.RECOGNIZE_FACES, concurrency: 1 })
  async onRecognizeFaces(job: Job<IAssetJob>) {
    await this.facialRecognitionService.handleRecognizeFaces(job.data);
  }

  @Process({ name: JobName.GENERATE_FACE_THUMBNAIL, concurrency: 1 })
  async onGenerateFaceThumbnail(job: Job<IFaceThumbnailJob>) {
    await this.facialRecognitionService.handleGenerateFaceThumbnail(job.data);
  }
}

@Processor(QueueName.CLIP_ENCODING)
export class ClipEncodingProcessor {
  constructor(private smartInfoService: SmartInfoService) {}

  @Process({ name: JobName.QUEUE_ENCODE_CLIP, concurrency: 0 })
  async onQueueClipEncoding(job: Job<IBaseJob>) {
    await this.smartInfoService.handleQueueEncodeClip(job.data);
  }

  @Process({ name: JobName.ENCODE_CLIP, concurrency: 1 })
  async onEncodeClip(job: Job<IAssetJob>) {
    await this.smartInfoService.handleEncodeClip(job.data);
  }
}

@Processor(QueueName.SEARCH)
export class SearchIndexProcessor {
  constructor(private searchService: SearchService) {}

  @Process(JobName.SEARCH_INDEX_ALBUMS)
  async onIndexAlbums() {
    await this.searchService.handleIndexAlbums();
  }

  @Process(JobName.SEARCH_INDEX_ASSETS)
  async onIndexAssets() {
    await this.searchService.handleIndexAssets();
  }

  @Process(JobName.SEARCH_INDEX_FACES)
  async onIndexFaces() {
    await this.searchService.handleIndexFaces();
  }

  @Process(JobName.SEARCH_INDEX_ALBUM)
  onIndexAlbum(job: Job<IBulkEntityJob>) {
    this.searchService.handleIndexAlbum(job.data);
  }

  @Process(JobName.SEARCH_INDEX_ASSET)
  onIndexAsset(job: Job<IBulkEntityJob>) {
    this.searchService.handleIndexAsset(job.data);
  }

  @Process(JobName.SEARCH_INDEX_FACE)
  async onIndexFace(job: Job<IAssetFaceJob>) {
    await this.searchService.handleIndexFace(job.data);
  }

  @Process(JobName.SEARCH_REMOVE_ALBUM)
  onRemoveAlbum(job: Job<IBulkEntityJob>) {
    this.searchService.handleRemoveAlbum(job.data);
  }

  @Process(JobName.SEARCH_REMOVE_ASSET)
  onRemoveAsset(job: Job<IBulkEntityJob>) {
    this.searchService.handleRemoveAsset(job.data);
  }

  @Process(JobName.SEARCH_REMOVE_FACE)
  onRemoveFace(job: Job<IAssetFaceJob>) {
    this.searchService.handleRemoveFace(job.data);
  }
}

@Processor(QueueName.STORAGE_TEMPLATE_MIGRATION)
export class StorageTemplateMigrationProcessor {
  constructor(private storageTemplateService: StorageTemplateService) {}

  @Process({ name: JobName.STORAGE_TEMPLATE_MIGRATION })
  async onTemplateMigration() {
    await this.storageTemplateService.handleTemplateMigration();
  }

  @Process({ name: JobName.STORAGE_TEMPLATE_MIGRATION_SINGLE })
  async onTemplateMigrationSingle(job: Job<IAssetJob>) {
    await this.storageTemplateService.handleTemplateMigrationSingle(job.data);
  }
}

@Processor(QueueName.THUMBNAIL_GENERATION)
export class ThumbnailGeneratorProcessor {
  constructor(private mediaService: MediaService) {}

  @Process({ name: JobName.QUEUE_GENERATE_THUMBNAILS, concurrency: 0 })
  async onQueueGenerateThumbnails(job: Job<IBaseJob>) {
    await this.mediaService.handleQueueGenerateThumbnails(job.data);
  }

  @Process({ name: JobName.GENERATE_JPEG_THUMBNAIL, concurrency: 3 })
  async onGenerateJpegThumbnail(job: Job<IAssetJob>) {
    await this.mediaService.handleGenerateJpegThumbnail(job.data);
  }

  @Process({ name: JobName.GENERATE_WEBP_THUMBNAIL, concurrency: 3 })
  async onGenerateWepbThumbnail(job: Job<IAssetJob>) {
    await this.mediaService.handleGenerateWepbThumbnail(job.data);
  }
}

@Processor(QueueName.VIDEO_CONVERSION)
export class VideoTranscodeProcessor {
  constructor(private mediaService: MediaService) {}

  @Process({ name: JobName.QUEUE_VIDEO_CONVERSION, concurrency: 0 })
  async onQueueVideoConversion(job: Job<IBaseJob>): Promise<void> {
    await this.mediaService.handleQueueVideoConversion(job.data);
  }

  @Process({ name: JobName.VIDEO_CONVERSION, concurrency: 1 })
  async onVideoConversion(job: Job<IAssetJob>) {
    await this.mediaService.handleVideoConversion(job.data);
  }
}
