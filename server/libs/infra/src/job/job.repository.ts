import { IAssetJob, IJobRepository, IMetadataExtractionJob, JobCounts, JobItem, JobName, QueueName } from '@app/domain';
import { InjectQueue } from '@nestjs/bull';
import { BadRequestException, Logger } from '@nestjs/common';
import { Queue } from 'bull';

export class JobRepository implements IJobRepository {
  private logger = new Logger(JobRepository.name);

  constructor(
    @InjectQueue(QueueName.BACKGROUND_TASK) private backgroundTask: Queue,
    @InjectQueue(QueueName.MACHINE_LEARNING) private machineLearning: Queue<IAssetJob>,
    @InjectQueue(QueueName.METADATA_EXTRACTION) private metadataExtraction: Queue<IMetadataExtractionJob>,
    @InjectQueue(QueueName.STORAGE_TEMPLATE_MIGRATION) private storageTemplateMigration: Queue,
    @InjectQueue(QueueName.THUMBNAIL_GENERATION) private thumbnail: Queue,
    @InjectQueue(QueueName.VIDEO_CONVERSION) private videoTranscode: Queue<IAssetJob>,
    @InjectQueue(QueueName.SEARCH) private searchIndex: Queue,
  ) {}

  async isActive(name: QueueName): Promise<boolean> {
    const counts = await this.getJobCounts(name);
    return !!counts.active;
  }

  empty(name: QueueName) {
    return this.getQueue(name).empty();
  }

  getJobCounts(name: QueueName): Promise<JobCounts> {
    return this.getQueue(name).getJobCounts();
  }

  async queue(item: JobItem): Promise<void> {
    switch (item.name) {
      case JobName.ASSET_UPLOADED:
        await this.backgroundTask.add(item.name, item.data, { jobId: item.data.asset.id });
        break;

      case JobName.DELETE_FILES:
        await this.backgroundTask.add(item.name, item.data);
        break;

      case JobName.OBJECT_DETECTION:
      case JobName.IMAGE_TAGGING:
      case JobName.ENCODE_CLIP:
        await this.machineLearning.add(item.name, item.data);
        break;

      case JobName.EXIF_EXTRACTION:
      case JobName.EXTRACT_VIDEO_METADATA:
      case JobName.REVERSE_GEOCODING:
        await this.metadataExtraction.add(item.name, item.data);
        break;

      case JobName.GENERATE_JPEG_THUMBNAIL:
      case JobName.GENERATE_WEBP_THUMBNAIL:
        await this.thumbnail.add(item.name, item.data);
        break;

      case JobName.USER_DELETION:
        await this.backgroundTask.add(item.name, item.data);
        break;

      case JobName.STORAGE_TEMPLATE_MIGRATION:
        await this.storageTemplateMigration.add(item.name);
        break;

      case JobName.SYSTEM_CONFIG_CHANGE:
        await this.backgroundTask.add(item.name, {});
        break;

      case JobName.VIDEO_CONVERSION:
        await this.videoTranscode.add(item.name, item.data);
        break;

      case JobName.SEARCH_INDEX_ASSETS:
      case JobName.SEARCH_INDEX_ALBUMS:
        await this.searchIndex.add(item.name, {});
        break;

      case JobName.SEARCH_INDEX_ASSET:
      case JobName.SEARCH_INDEX_ALBUM:
      case JobName.SEARCH_REMOVE_ALBUM:
      case JobName.SEARCH_REMOVE_ASSET:
        await this.searchIndex.add(item.name, item.data);
        break;

      default:
        // TODO inject remaining queues and map job to queue
        this.logger.error('Invalid job', item);
    }
  }

  private getQueue(name: QueueName) {
    switch (name) {
      case QueueName.STORAGE_TEMPLATE_MIGRATION:
        return this.storageTemplateMigration;
      case QueueName.THUMBNAIL_GENERATION:
        return this.thumbnail;
      case QueueName.METADATA_EXTRACTION:
        return this.metadataExtraction;
      case QueueName.VIDEO_CONVERSION:
        return this.videoTranscode;
      case QueueName.MACHINE_LEARNING:
        return this.machineLearning;
      default:
        throw new BadRequestException('Invalid job name');
    }
  }
}
