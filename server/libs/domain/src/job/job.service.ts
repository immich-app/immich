import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { IAssetRepository, mapAsset } from '../asset';
import { CommunicationEvent, ICommunicationRepository } from '../communication';
import { assertMachineLearningEnabled } from '../domain.constant';
import { JobCommandDto } from './dto';
import { JobCommand, JobName, QueueName } from './job.constants';
import { IJobRepository, JobItem } from './job.repository';
import { AllJobStatusResponseDto, JobStatusDto } from './response-dto';

@Injectable()
export class JobService {
  private logger = new Logger(JobService.name);

  constructor(
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(ICommunicationRepository) private communicationRepository: ICommunicationRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
  ) {}

  handleCommand(queueName: QueueName, dto: JobCommandDto): Promise<void> {
    this.logger.debug(`Handling command: queue=${queueName},force=${dto.force}`);

    switch (dto.command) {
      case JobCommand.START:
        return this.start(queueName, dto);

      case JobCommand.PAUSE:
        return this.jobRepository.pause(queueName);

      case JobCommand.RESUME:
        return this.jobRepository.resume(queueName);

      case JobCommand.EMPTY:
        return this.jobRepository.empty(queueName);
    }
  }

  async getJobStatus(queueName: QueueName): Promise<JobStatusDto> {
    const [jobCounts, queueStatus] = await Promise.all([
      this.jobRepository.getJobCounts(queueName),
      this.jobRepository.getQueueStatus(queueName),
    ]);

    return { jobCounts, queueStatus };
  }

  async getAllJobsStatus(): Promise<AllJobStatusResponseDto> {
    const response = new AllJobStatusResponseDto();
    for (const queueName of Object.values(QueueName)) {
      response[queueName] = await this.getJobStatus(queueName);
    }
    return response;
  }

  private async start(name: QueueName, { force }: JobCommandDto): Promise<void> {
    const { isActive } = await this.jobRepository.getQueueStatus(name);
    if (isActive) {
      throw new BadRequestException(`Job is already running`);
    }

    switch (name) {
      case QueueName.VIDEO_CONVERSION:
        return this.jobRepository.queue({ name: JobName.QUEUE_VIDEO_CONVERSION, data: { force } });

      case QueueName.STORAGE_TEMPLATE_MIGRATION:
        return this.jobRepository.queue({ name: JobName.STORAGE_TEMPLATE_MIGRATION });

      case QueueName.OBJECT_TAGGING:
        assertMachineLearningEnabled();
        return this.jobRepository.queue({ name: JobName.QUEUE_OBJECT_TAGGING, data: { force } });

      case QueueName.CLIP_ENCODING:
        assertMachineLearningEnabled();
        return this.jobRepository.queue({ name: JobName.QUEUE_ENCODE_CLIP, data: { force } });

      case QueueName.METADATA_EXTRACTION:
        return this.jobRepository.queue({ name: JobName.QUEUE_METADATA_EXTRACTION, data: { force } });

      case QueueName.SIDECAR:
        return this.jobRepository.queue({ name: JobName.QUEUE_SIDECAR, data: { force } });

      case QueueName.THUMBNAIL_GENERATION:
        return this.jobRepository.queue({ name: JobName.QUEUE_GENERATE_THUMBNAILS, data: { force } });

      case QueueName.RECOGNIZE_FACES:
        return this.jobRepository.queue({ name: JobName.QUEUE_RECOGNIZE_FACES, data: { force } });

      default:
        throw new BadRequestException(`Invalid job name: ${name}`);
    }
  }

  async handleNightlyJobs() {
    await this.jobRepository.queue({ name: JobName.USER_DELETE_CHECK });
    await this.jobRepository.queue({ name: JobName.PERSON_CLEANUP });
    await this.jobRepository.queue({ name: JobName.QUEUE_GENERATE_THUMBNAILS, data: { force: false } });
  }

  /**
   * Queue follow up jobs
   */
  async onDone(item: JobItem) {
    switch (item.name) {
      case JobName.SIDECAR_SYNC:
      case JobName.SIDECAR_DISCOVERY:
        await this.jobRepository.queue({ name: JobName.METADATA_EXTRACTION, data: { id: item.data.id } });
        break;

      case JobName.METADATA_EXTRACTION:
        await this.jobRepository.queue({ name: JobName.STORAGE_TEMPLATE_MIGRATION_SINGLE, data: item.data });
        break;

      case JobName.STORAGE_TEMPLATE_MIGRATION_SINGLE:
        if (item.data.source === 'upload') {
          await this.jobRepository.queue({ name: JobName.GENERATE_JPEG_THUMBNAIL, data: item.data });
        }
        break;

      case JobName.GENERATE_JPEG_THUMBNAIL: {
        await this.jobRepository.queue({ name: JobName.GENERATE_WEBP_THUMBNAIL, data: item.data });
        await this.jobRepository.queue({ name: JobName.CLASSIFY_IMAGE, data: item.data });
        await this.jobRepository.queue({ name: JobName.DETECT_OBJECTS, data: item.data });
        await this.jobRepository.queue({ name: JobName.ENCODE_CLIP, data: item.data });
        await this.jobRepository.queue({ name: JobName.RECOGNIZE_FACES, data: item.data });

        const [asset] = await this.assetRepository.getByIds([item.data.id]);
        if (asset) {
          this.communicationRepository.send(CommunicationEvent.UPLOAD_SUCCESS, asset.ownerId, mapAsset(asset));
        }
        break;
      }
    }

    // In addition to the above jobs, all of these should queue `SEARCH_INDEX_ASSET`
    switch (item.name) {
      case JobName.CLASSIFY_IMAGE:
      case JobName.DETECT_OBJECTS:
      case JobName.ENCODE_CLIP:
      case JobName.RECOGNIZE_FACES:
      case JobName.METADATA_EXTRACTION:
        await this.jobRepository.queue({ name: JobName.SEARCH_INDEX_ASSET, data: { ids: [item.data.id] } });
        break;
    }
  }
}
