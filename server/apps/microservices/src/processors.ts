import {
  AssetService,
  IAssetJob,
  IAssetUploadedJob,
  IBaseJob,
  IBulkEntityJob,
  IDeleteFilesJob,
  IUserDeletionJob,
  JobName,
  MediaService,
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

  @Process(JobName.USER_DELETION)
  async onUserDelete(job: Job<IUserDeletionJob>) {
    await this.userService.handleUserDelete(job.data);
  }
}

@Processor(QueueName.OBJECT_TAGGING)
export class ObjectTaggingProcessor {
  constructor(private smartInfoService: SmartInfoService) {}

  @Process({ name: JobName.QUEUE_OBJECT_TAGGING, concurrency: 1 })
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

@Processor(QueueName.CLIP_ENCODING)
export class ClipEncodingProcessor {
  constructor(private smartInfoService: SmartInfoService) {}

  @Process({ name: JobName.QUEUE_ENCODE_CLIP, concurrency: 1 })
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

  @Process(JobName.SEARCH_INDEX_ALBUM)
  onIndexAlbum(job: Job<IBulkEntityJob>) {
    this.searchService.handleIndexAlbum(job.data);
  }

  @Process(JobName.SEARCH_INDEX_ASSET)
  onIndexAsset(job: Job<IBulkEntityJob>) {
    this.searchService.handleIndexAsset(job.data);
  }

  @Process(JobName.SEARCH_REMOVE_ALBUM)
  onRemoveAlbum(job: Job<IBulkEntityJob>) {
    this.searchService.handleRemoveAlbum(job.data);
  }

  @Process(JobName.SEARCH_REMOVE_ASSET)
  onRemoveAsset(job: Job<IBulkEntityJob>) {
    this.searchService.handleRemoveAsset(job.data);
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

  @Process({ name: JobName.QUEUE_GENERATE_THUMBNAILS, concurrency: 1 })
  async handleQueueGenerateThumbnails(job: Job<IBaseJob>) {
    await this.mediaService.handleQueueGenerateThumbnails(job.data);
  }

  @Process({ name: JobName.GENERATE_JPEG_THUMBNAIL, concurrency: 3 })
  async handleGenerateJpegThumbnail(job: Job<IAssetJob>) {
    await this.mediaService.handleGenerateJpegThumbnail(job.data);
  }

  @Process({ name: JobName.GENERATE_WEBP_THUMBNAIL, concurrency: 3 })
  async handleGenerateWepbThumbnail(job: Job<IAssetJob>) {
    await this.mediaService.handleGenerateWepbThumbnail(job.data);
  }
}

@Processor(QueueName.VIDEO_CONVERSION)
export class VideoTranscodeProcessor {
  constructor(private mediaService: MediaService) {}

  @Process({ name: JobName.QUEUE_VIDEO_CONVERSION, concurrency: 1 })
  async onQueueVideoConversion(job: Job<IBaseJob>): Promise<void> {
    await this.mediaService.handleQueueVideoConversion(job.data);
  }

  @Process({ name: JobName.VIDEO_CONVERSION, concurrency: 2 })
  async onVideoConversion(job: Job<IAssetJob>) {
    await this.mediaService.handleVideoConversion(job.data);
  }
}
