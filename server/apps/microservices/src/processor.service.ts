import {
  AssetService,
  FacialRecognitionService,
  JobName,
  JOBS_TO_QUEUE,
  MediaService,
  MetadataService,
  PersonService,
  QueueName,
  QUEUE_TO_CONCURRENCY,
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
    // TODO refactor to domain
    private metadataProcessor: MetadataExtractionProcessor,

    private assetService: AssetService,
    private facialRecognitionService: FacialRecognitionService,
    private mediaService: MediaService,
    private metadataService: MetadataService,
    private personService: PersonService,
    private searchService: SearchService,
    private smartInfoService: SmartInfoService,
    private storageTemplateService: StorageTemplateService,
    private storageService: StorageService,
    private systemConfigService: SystemConfigService,
    private userService: UserService,
  ) {}

  private handlers: Record<JobName, JobHandler> = {
    [JobName.ASSET_UPLOADED]: (data) => this.assetService.handleAssetUpload(data),
    [JobName.DELETE_FILES]: (data) => this.storageService.handleDeleteFiles(data),
    [JobName.USER_DELETE_CHECK]: () => this.userService.handleUserDeleteCheck(),
    [JobName.USER_DELETION]: (data) => this.userService.handleUserDelete(data),
    [JobName.QUEUE_OBJECT_TAGGING]: (data) => this.smartInfoService.handleQueueObjectTagging(data),
    [JobName.DETECT_OBJECTS]: (data) => this.smartInfoService.handleDetectObjects(data),
    [JobName.CLASSIFY_IMAGE]: (data) => this.smartInfoService.handleClassifyImage(data),
    [JobName.QUEUE_ENCODE_CLIP]: (data) => this.smartInfoService.handleQueueEncodeClip(data),
    [JobName.ENCODE_CLIP]: (data) => this.smartInfoService.handleEncodeClip(data),
    [JobName.SEARCH_INDEX_ALBUMS]: () => this.searchService.handleIndexAlbums(),
    [JobName.SEARCH_INDEX_ASSETS]: () => this.searchService.handleIndexAssets(),
    [JobName.SEARCH_INDEX_FACES]: () => this.searchService.handleIndexFaces(),
    [JobName.SEARCH_INDEX_ALBUM]: (data) => this.searchService.handleIndexAlbum(data),
    [JobName.SEARCH_INDEX_ASSET]: (data) => this.searchService.handleIndexAsset(data),
    [JobName.SEARCH_INDEX_FACE]: (data) => this.searchService.handleIndexFace(data),
    [JobName.SEARCH_REMOVE_ALBUM]: (data) => this.searchService.handleRemoveAlbum(data),
    [JobName.SEARCH_REMOVE_ASSET]: (data) => this.searchService.handleRemoveAsset(data),
    [JobName.SEARCH_REMOVE_FACE]: (data) => this.searchService.handleRemoveFace(data),
    [JobName.STORAGE_TEMPLATE_MIGRATION]: () => this.storageTemplateService.handleMigration(),
    [JobName.STORAGE_TEMPLATE_MIGRATION_SINGLE]: (data) => this.storageTemplateService.handleMigrationSingle(data),
    [JobName.SYSTEM_CONFIG_CHANGE]: () => this.systemConfigService.refreshConfig(),
    [JobName.QUEUE_GENERATE_THUMBNAILS]: (data) => this.mediaService.handleQueueGenerateThumbnails(data),
    [JobName.GENERATE_JPEG_THUMBNAIL]: (data) => this.mediaService.handleGenerateJpegThumbnail(data),
    [JobName.GENERATE_WEBP_THUMBNAIL]: (data) => this.mediaService.handleGenerateWepbThumbnail(data),
    [JobName.QUEUE_VIDEO_CONVERSION]: (data) => this.mediaService.handleQueueVideoConversion(data),
    [JobName.VIDEO_CONVERSION]: (data) => this.mediaService.handleVideoConversion(data),
    [JobName.QUEUE_METADATA_EXTRACTION]: (data) => this.metadataProcessor.handleQueueMetadataExtraction(data),
    [JobName.EXIF_EXTRACTION]: (data) => this.metadataProcessor.extractExifInfo(data),
    [JobName.EXTRACT_VIDEO_METADATA]: (data) => this.metadataProcessor.extractVideoMetadata(data),
    [JobName.QUEUE_RECOGNIZE_FACES]: (data) => this.facialRecognitionService.handleQueueRecognizeFaces(data),
    [JobName.RECOGNIZE_FACES]: (data) => this.facialRecognitionService.handleRecognizeFaces(data),
    [JobName.GENERATE_FACE_THUMBNAIL]: (data) => this.facialRecognitionService.handleGenerateFaceThumbnail(data),
    [JobName.PERSON_CLEANUP]: () => this.personService.handlePersonCleanup(),
    [JobName.QUEUE_SIDECAR]: (data) => this.metadataService.handleQueueSidecar(data),
    [JobName.SIDECAR_DISCOVERY]: (data) => this.metadataService.handleSidecarDiscovery(data),
    [JobName.SIDECAR_SYNC]: (data) => this.metadataService.handleSidecarSync(data),
  };

  async init() {
    const queueSeen: Partial<Record<QueueName, boolean>> = {};

    for (const jobName of Object.values(JobName)) {
      const handler = this.handlers[jobName];
      const queueName = JOBS_TO_QUEUE[jobName];
      const queue = this.moduleRef.get<Queue>(getQueueToken(queueName), { strict: false });

      // only set concurrency on the first job for a queue, since concurrency stacks
      const seen = queueSeen[queueName];
      const concurrency = seen ? 0 : QUEUE_TO_CONCURRENCY[queueName];
      queueSeen[queueName] = true;

      await queue.isReady();

      queue.process(jobName, concurrency, async (job): Promise<void> => {
        await handler(job.data);
      });
    }
  }
}
