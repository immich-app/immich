import {
  AssetService,
  JobName,
  MediaService,
  SearchService,
  SmartInfoService,
  StorageService,
  StorageTemplateService,
  SystemConfigService,
  UserService,
} from '@app/domain';
import { getQueueToken } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Queue } from 'bull';
import { MetadataExtractionProcessor } from './processors/metadata-extraction.processor';

type JobHandler<T = any> = (data: T) => void | Promise<void>;

@Injectable()
export class ProcessorService {
  constructor(
    private moduleRef: ModuleRef,
    private metadataProcessor: MetadataExtractionProcessor,

    private assetService: AssetService,
    private mediaService: MediaService,
    private searchService: SearchService,
    private smartInfoService: SmartInfoService,
    private storageTemplateService: StorageTemplateService,
    private storageService: StorageService,
    private systemConfigService: SystemConfigService,
    private userService: UserService,
  ) {}

  private handlers: Record<JobName, [concurrency: number, handler: JobHandler]> = {
    // asset upload
    [JobName.ASSET_UPLOADED]: [1, (data) => this.assetService.handleAssetUpload(data)],
    [JobName.DELETE_FILES]: [1, (data) => this.storageService.handleDeleteFiles(data)],

    // user delete
    [JobName.QUEUE_USER_DELETE]: [1, () => this.userService.handleQueueUserDelete()],
    [JobName.USER_DELETE]: [1, (data) => this.userService.handleUserDelete(data)],

    // machine learning
    [JobName.QUEUE_OBJECT_TAGGING]: [1, (data) => this.smartInfoService.handleQueueObjectTagging(data)],
    [JobName.DETECT_OBJECTS]: [1, (data) => this.smartInfoService.handleDetectObjects(data)],
    [JobName.CLASSIFY_IMAGE]: [1, (data) => this.smartInfoService.handleClassifyImage(data)],
    [JobName.QUEUE_ENCODE_CLIP]: [1, (data) => this.smartInfoService.handleQueueEncodeClip(data)],
    [JobName.ENCODE_CLIP]: [1, (data) => this.smartInfoService.handleEncodeClip(data)],

    // search
    [JobName.SEARCH_INDEX_ALBUMS]: [1, () => this.searchService.handleIndexAlbums()],
    [JobName.SEARCH_INDEX_ASSETS]: [1, () => this.searchService.handleIndexAssets()],
    [JobName.SEARCH_INDEX_ALBUM]: [1, (data) => this.searchService.handleIndexAlbum(data)],
    [JobName.SEARCH_INDEX_ASSET]: [1, (data) => this.searchService.handleIndexAsset(data)],
    [JobName.SEARCH_REMOVE_ALBUM]: [1, (data) => this.searchService.handleRemoveAlbum(data)],
    [JobName.SEARCH_REMOVE_ASSET]: [1, (data) => this.searchService.handleRemoveAsset(data)],

    // storage template
    [JobName.STORAGE_TEMPLATE_MIGRATION]: [1, () => this.storageTemplateService.handleTemplateMigration()],
    [JobName.STORAGE_TEMPLATE_MIGRATION_SINGLE]: [
      1,
      (data) => this.storageTemplateService.handleTemplateMigrationSingle(data),
    ],
    [JobName.SYSTEM_CONFIG_CHANGE]: [1, () => this.systemConfigService.refreshConfig()],

    // thumbnails
    [JobName.QUEUE_GENERATE_THUMBNAILS]: [1, (data) => this.mediaService.handleQueueGenerateThumbnails(data)],
    [JobName.GENERATE_JPEG_THUMBNAIL]: [3, (data) => this.mediaService.handleGenerateJpegThumbnail(data)],
    [JobName.GENERATE_WEBP_THUMBNAIL]: [3, (data) => this.mediaService.handleGenerateWepbThumbnail(data)],

    // transcoding
    [JobName.QUEUE_VIDEO_CONVERSION]: [1, (data) => this.mediaService.handleQueueVideoConversion(data)],
    [JobName.VIDEO_CONVERSION]: [1, (data) => this.mediaService.handleVideoConversion(data)],

    // exif
    [JobName.QUEUE_METADATA_EXTRACTION]: [1, (data) => this.metadataProcessor.handleQueueMetadataExtraction(data)],
    [JobName.EXIF_EXTRACTION]: [1, (data) => this.metadataProcessor.extractExifInfo(data)],
    [JobName.EXTRACT_VIDEO_METADATA]: [1, (data) => this.metadataProcessor.extractVideoMetadata(data)],
  };

  async init() {
    for (const jobName of Object.values(JobName)) {
      const queue = this.moduleRef.get<Queue>(getQueueToken(jobName), { strict: false });
      const [concurrency, handler] = this.handlers[jobName];
      await queue.isReady();
      queue.process(concurrency, async (job): Promise<void> => {
        await handler(job.data);
      });
    }
  }
}
