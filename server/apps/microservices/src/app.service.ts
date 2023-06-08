import {
  FacialRecognitionService,
  IDeleteFilesJob,
  JobName,
  JobService,
  MediaService,
  MetadataService,
  PersonService,
  SearchService,
  SmartInfoService,
  StorageService,
  StorageTemplateService,
  SystemConfigService,
  UserService,
} from '@app/domain';
import { Injectable, Logger } from '@nestjs/common';
import { MetadataExtractionProcessor } from './processors/metadata-extraction.processor';

@Injectable()
export class AppService {
  private logger = new Logger(AppService.name);

  constructor(
    // TODO refactor to domain
    private metadataProcessor: MetadataExtractionProcessor,

    private facialRecognitionService: FacialRecognitionService,
    private jobService: JobService,
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

  async init() {
    await this.jobService.registerHandlers({
      [JobName.DELETE_FILES]: (data: IDeleteFilesJob) => this.storageService.handleDeleteFiles(data),
      [JobName.USER_DELETE_CHECK]: () => this.userService.handleUserDeleteCheck(),
      [JobName.USER_DELETION]: (data) => this.userService.handleUserDelete(data),
      [JobName.QUEUE_OBJECT_TAGGING]: (data) => this.smartInfoService.handleQueueObjectTagging(data),
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
      [JobName.METADATA_EXTRACTION]: (data) => this.metadataProcessor.handleMetadataExtraction(data),
      [JobName.QUEUE_RECOGNIZE_FACES]: (data) => this.facialRecognitionService.handleQueueRecognizeFaces(data),
      [JobName.RECOGNIZE_FACES]: (data) => this.facialRecognitionService.handleRecognizeFaces(data),
      [JobName.GENERATE_FACE_THUMBNAIL]: (data) => this.facialRecognitionService.handleGenerateFaceThumbnail(data),
      [JobName.PERSON_CLEANUP]: () => this.personService.handlePersonCleanup(),
      [JobName.QUEUE_SIDECAR]: (data) => this.metadataService.handleQueueSidecar(data),
      [JobName.SIDECAR_DISCOVERY]: (data) => this.metadataService.handleSidecarDiscovery(data),
      [JobName.SIDECAR_SYNC]: () => this.metadataService.handleSidecarSync(),
    });

    process.on('uncaughtException', (error: Error | any) => {
      const isCsvError = error.code === 'CSV_RECORD_INCONSISTENT_FIELDS_LENGTH';
      if (!isCsvError) {
        throw error;
      }

      this.logger.warn('Geocoding csv parse error, trying again without cache...');
      this.metadataProcessor.init(true);
    });

    await this.metadataProcessor.init();
  }
}
