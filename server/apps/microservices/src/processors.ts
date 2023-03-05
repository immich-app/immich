import {
  AssetService,
  IAlbumJob,
  IAssetJob,
  IAssetUploadedJob,
  IDeleteFilesJob,
  IDeleteJob,
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

@Processor(QueueName.MACHINE_LEARNING)
export class MachineLearningProcessor {
  constructor(private smartInfoService: SmartInfoService) {}

  @Process({ name: JobName.IMAGE_TAGGING, concurrency: 1 })
  async onTagImage(job: Job<IAssetJob>) {
    await this.smartInfoService.handleTagImage(job.data);
  }

  @Process({ name: JobName.OBJECT_DETECTION, concurrency: 1 })
  async onDetectObject(job: Job<IAssetJob>) {
    await this.smartInfoService.handleDetectObjects(job.data);
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
  async onIndexAlbum(job: Job<IAlbumJob>) {
    await this.searchService.handleIndexAlbum(job.data);
  }

  @Process(JobName.SEARCH_INDEX_ASSET)
  async onIndexAsset(job: Job<IAssetJob>) {
    await this.searchService.handleIndexAsset(job.data);
  }

  @Process(JobName.SEARCH_REMOVE_ALBUM)
  async onRemoveAlbum(job: Job<IDeleteJob>) {
    await this.searchService.handleRemoveAlbum(job.data);
  }

  @Process(JobName.SEARCH_REMOVE_ASSET)
  async onRemoveAsset(job: Job<IDeleteJob>) {
    await this.searchService.handleRemoveAsset(job.data);
  }
}

@Processor(QueueName.STORAGE_TEMPLATE_MIGRATION)
export class StorageTemplateMigrationProcessor {
  constructor(private storageTemplateService: StorageTemplateService) {}

  @Process({ name: JobName.STORAGE_TEMPLATE_MIGRATION })
  async onTemplateMigration() {
    await this.storageTemplateService.handleTemplateMigration();
  }
}

@Processor(QueueName.THUMBNAIL_GENERATION)
export class ThumbnailGeneratorProcessor {
  constructor(private mediaService: MediaService) {}

  @Process({ name: JobName.GENERATE_JPEG_THUMBNAIL, concurrency: 3 })
  async handleGenerateJpegThumbnail(job: Job<IAssetJob>) {
    await this.mediaService.handleGenerateJpegThumbnail(job.data);
  }

  @Process({ name: JobName.GENERATE_WEBP_THUMBNAIL, concurrency: 3 })
  async handleGenerateWepbThumbnail(job: Job<IAssetJob>) {
    await this.mediaService.handleGenerateWepbThumbnail(job.data);
  }
}
