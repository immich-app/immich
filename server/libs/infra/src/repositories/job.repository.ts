import { IAssetJob, IBaseJob, IJobRepository, JobCounts, JobItem, JobName, QueueName, QueueStatus } from '@app/domain';
import { InjectQueue } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Queue, type JobCounts as BullJobCounts } from 'bull';

export class JobRepository implements IJobRepository {
  private logger = new Logger(JobRepository.name);
  private queueMap: Record<QueueName, Queue> = {
    [QueueName.STORAGE_TEMPLATE_MIGRATION]: this.storageTemplateMigration,
    [QueueName.THUMBNAIL_GENERATION]: this.generateThumbnail,
    [QueueName.METADATA_EXTRACTION]: this.metadataExtraction,
    [QueueName.OBJECT_TAGGING]: this.objectTagging,
    [QueueName.RECOGNIZE_FACES]: this.recognizeFaces,
    [QueueName.CLIP_ENCODING]: this.clipEmbedding,
    [QueueName.VIDEO_CONVERSION]: this.videoTranscode,
    [QueueName.BACKGROUND_TASK]: this.backgroundTask,
    [QueueName.SEARCH]: this.searchIndex,
    [QueueName.SIDECAR]: this.sidecar,
  };

  constructor(
    @InjectQueue(QueueName.BACKGROUND_TASK) private backgroundTask: Queue,
    @InjectQueue(QueueName.OBJECT_TAGGING) private objectTagging: Queue<IAssetJob | IBaseJob>,
    @InjectQueue(QueueName.CLIP_ENCODING) private clipEmbedding: Queue<IAssetJob | IBaseJob>,
    @InjectQueue(QueueName.METADATA_EXTRACTION) private metadataExtraction: Queue<IAssetJob | IBaseJob>,
    @InjectQueue(QueueName.RECOGNIZE_FACES) private recognizeFaces: Queue<IAssetJob | IBaseJob>,
    @InjectQueue(QueueName.STORAGE_TEMPLATE_MIGRATION) private storageTemplateMigration: Queue,
    @InjectQueue(QueueName.THUMBNAIL_GENERATION) private generateThumbnail: Queue,
    @InjectQueue(QueueName.VIDEO_CONVERSION) private videoTranscode: Queue<IAssetJob | IBaseJob>,
    @InjectQueue(QueueName.SEARCH) private searchIndex: Queue,
    @InjectQueue(QueueName.SIDECAR) private sidecar: Queue<IBaseJob>,
  ) {}

  async getQueueStatus(name: QueueName): Promise<QueueStatus> {
    const queue = this.queueMap[name];

    return {
      isActive: !!(await queue.getActiveCount()),
      isPaused: await queue.isPaused(),
    };
  }

  pause(name: QueueName) {
    return this.queueMap[name].pause();
  }

  resume(name: QueueName) {
    return this.queueMap[name].resume();
  }

  empty(name: QueueName) {
    return this.queueMap[name].empty();
  }

  getJobCounts(name: QueueName): Promise<JobCounts> {
    // Typecast needed because the `paused` key is missing from Bull's
    // type definition. Can be removed once fixed upstream.
    return this.queueMap[name].getJobCounts() as Promise<BullJobCounts & { paused: number }>;
  }

  async queue(item: JobItem): Promise<void> {
    switch (item.name) {
      case JobName.ASSET_UPLOADED:
        await this.backgroundTask.add(item.name, item.data, { jobId: item.data.asset.id });
        break;

      case JobName.DELETE_FILES:
        await this.backgroundTask.add(item.name, item.data);
        break;

      case JobName.QUEUE_OBJECT_TAGGING:
      case JobName.DETECT_OBJECTS:
      case JobName.CLASSIFY_IMAGE:
        await this.objectTagging.add(item.name, item.data);
        break;

      case JobName.QUEUE_ENCODE_CLIP:
      case JobName.ENCODE_CLIP:
        await this.clipEmbedding.add(item.name, item.data);
        break;

      case JobName.QUEUE_METADATA_EXTRACTION:
      case JobName.EXIF_EXTRACTION:
      case JobName.EXTRACT_VIDEO_METADATA:
        await this.metadataExtraction.add(item.name, item.data);
        break;

      case JobName.QUEUE_SIDECAR:
      case JobName.SIDECAR_DISCOVERY:
      case JobName.SIDECAR_SYNC:
        await this.sidecar.add(item.name, item.data);
        break;

      case JobName.QUEUE_RECOGNIZE_FACES:
      case JobName.RECOGNIZE_FACES:
        await this.recognizeFaces.add(item.name, item.data);
        break;

      case JobName.GENERATE_FACE_THUMBNAIL:
        await this.recognizeFaces.add(item.name, item.data, { priority: 1 });
        break;

      case JobName.PERSON_CLEANUP:
        await this.backgroundTask.add(item.name);
        break;

      case JobName.QUEUE_GENERATE_THUMBNAILS:
      case JobName.GENERATE_JPEG_THUMBNAIL:
      case JobName.GENERATE_WEBP_THUMBNAIL:
        await this.generateThumbnail.add(item.name, item.data);
        break;

      case JobName.USER_DELETION:
        await this.backgroundTask.add(item.name, item.data);
        break;

      case JobName.STORAGE_TEMPLATE_MIGRATION:
        await this.storageTemplateMigration.add(item.name);
        break;

      case JobName.STORAGE_TEMPLATE_MIGRATION_SINGLE:
        await this.storageTemplateMigration.add(item.name, item.data);
        break;

      case JobName.SYSTEM_CONFIG_CHANGE:
        await this.backgroundTask.add(item.name, {});
        break;

      case JobName.QUEUE_VIDEO_CONVERSION:
      case JobName.VIDEO_CONVERSION:
        await this.videoTranscode.add(item.name, item.data);
        break;

      case JobName.SEARCH_INDEX_ASSETS:
      case JobName.SEARCH_INDEX_ALBUMS:
      case JobName.SEARCH_INDEX_FACES:
        await this.searchIndex.add(item.name, {});
        break;

      case JobName.SEARCH_INDEX_ASSET:
      case JobName.SEARCH_INDEX_ALBUM:
      case JobName.SEARCH_INDEX_FACE:
        await this.searchIndex.add(item.name, item.data);
        break;

      case JobName.SEARCH_REMOVE_ALBUM:
      case JobName.SEARCH_REMOVE_ASSET:
      case JobName.SEARCH_REMOVE_FACE:
        await this.searchIndex.add(item.name, item.data);
        break;

      default:
        this.logger.error('Invalid job', item);
    }
  }
}
