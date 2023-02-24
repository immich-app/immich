import {
  IAssetUploadedJob,
  IJobRepository,
  IMachineLearningJob,
  IMetadataExtractionJob,
  IUserDeletionJob,
  IVideoTranscodeJob,
  JobCounts,
  JobItem,
  JobName,
  QueueName,
} from '@app/domain';
import { InjectQueue } from '@nestjs/bull';
import { BadRequestException, Logger } from '@nestjs/common';
import { Queue } from 'bull';

export class JobRepository implements IJobRepository {
  private logger = new Logger(JobRepository.name);

  constructor(
    @InjectQueue(QueueName.ASSET_UPLOADED) private assetUploaded: Queue<IAssetUploadedJob>,
    @InjectQueue(QueueName.BACKGROUND_TASK) private backgroundTask: Queue,
    @InjectQueue(QueueName.MACHINE_LEARNING) private machineLearning: Queue<IMachineLearningJob>,
    @InjectQueue(QueueName.METADATA_EXTRACTION) private metadataExtraction: Queue<IMetadataExtractionJob>,
    @InjectQueue(QueueName.CONFIG) private storageMigration: Queue,
    @InjectQueue(QueueName.THUMBNAIL_GENERATION) private thumbnail: Queue,
    @InjectQueue(QueueName.USER_DELETION) private userDeletion: Queue<IUserDeletionJob>,
    @InjectQueue(QueueName.VIDEO_CONVERSION) private videoTranscode: Queue<IVideoTranscodeJob>,
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

  async add(item: JobItem): Promise<void> {
    switch (item.name) {
      case JobName.ASSET_UPLOADED:
        await this.assetUploaded.add(item.name, item.data, { jobId: item.data.asset.id });
        break;

      case JobName.DELETE_FILE_ON_DISK:
        await this.backgroundTask.add(item.name, item.data);
        break;

      case JobName.OBJECT_DETECTION:
      case JobName.IMAGE_TAGGING:
        await this.machineLearning.add(item.name, item.data);
        break;

      case JobName.EXIF_EXTRACTION:
      case JobName.EXTRACT_VIDEO_METADATA:
      case JobName.REVERSE_GEOCODING:
        await this.metadataExtraction.add(item.name, item.data);
        break;

      case JobName.TEMPLATE_MIGRATION:
      case JobName.CONFIG_CHANGE:
        await this.storageMigration.add(item.name, {});
        break;

      case JobName.GENERATE_JPEG_THUMBNAIL:
      case JobName.GENERATE_WEBP_THUMBNAIL:
        await this.thumbnail.add(item.name, item.data);
        break;

      case JobName.USER_DELETION:
        await this.userDeletion.add(item.name, item.data);
        break;

      case JobName.VIDEO_CONVERSION:
        await this.videoTranscode.add(item.name, item.data);
        break;

      default:
        // TODO inject remaining queues and map job to queue
        this.logger.error('Invalid job', item);
    }
  }

  private getQueue(name: QueueName) {
    switch (name) {
      case QueueName.THUMBNAIL_GENERATION:
        return this.thumbnail;
      case QueueName.METADATA_EXTRACTION:
        return this.metadataExtraction;
      case QueueName.VIDEO_CONVERSION:
        return this.videoTranscode;
      case QueueName.CONFIG:
        return this.storageMigration;
      case QueueName.MACHINE_LEARNING:
        return this.machineLearning;
      default:
        throw new BadRequestException('Invalid job name');
    }
  }
}
