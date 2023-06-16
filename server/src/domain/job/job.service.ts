import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { IAssetRepository, mapAsset } from '../asset';
import { CommunicationEvent, ICommunicationRepository } from '../communication';
import { assertMachineLearningEnabled } from '../domain.constant';
import { ISystemConfigRepository } from '../system-config';
import { SystemConfigCore } from '../system-config/system-config.core';
import { JobCommandDto } from './dto';
import { JobCommand, JobName, QueueName } from './job.constants';
import { IJobRepository, JobHandler, JobItem } from './job.repository';
import { AllJobStatusResponseDto, JobStatusDto } from './response-dto';

@Injectable()
export class JobService {
  private logger = new Logger(JobService.name);
  private configCore: SystemConfigCore;

  constructor(
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(ICommunicationRepository) private communicationRepository: ICommunicationRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(ISystemConfigRepository) configRepository: ISystemConfigRepository,
  ) {
    this.configCore = new SystemConfigCore(configRepository);
  }

  async handleCommand(queueName: QueueName, dto: JobCommandDto): Promise<JobStatusDto> {
    this.logger.debug(`Handling command: queue=${queueName},force=${dto.force}`);

    switch (dto.command) {
      case JobCommand.START:
        await this.start(queueName, dto);
        break;

      case JobCommand.PAUSE:
        await this.jobRepository.pause(queueName);
        break;

      case JobCommand.RESUME:
        await this.jobRepository.resume(queueName);
        break;

      case JobCommand.EMPTY:
        await this.jobRepository.empty(queueName);
        break;
    }

    return this.getJobStatus(queueName);
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

  async registerHandlers(jobHandlers: Record<JobName, JobHandler>) {
    const config = await this.configCore.getConfig();
    for (const queueName of Object.values(QueueName)) {
      const concurrency = config.job[queueName].concurrency;
      this.logger.debug(`Registering ${queueName} with a concurrency of ${concurrency}`);
      this.jobRepository.addHandler(queueName, concurrency, async (item: JobItem): Promise<void> => {
        const { name, data } = item;

        try {
          const handler = jobHandlers[name];
          const success = await handler(data);
          if (success) {
            await this.onDone(item);
          }
        } catch (error: Error | any) {
          this.logger.error(`Unable to run job handler: ${error}`, error?.stack, data);
        }
      });
    }

    this.configCore.config$.subscribe((config) => {
      this.logger.log(`Updating queue concurrency settings`);
      for (const queueName of Object.values(QueueName)) {
        const concurrency = config.job[queueName].concurrency;
        this.logger.debug(`Setting ${queueName} concurrency to ${concurrency}`);
        this.jobRepository.setConcurrency(queueName, concurrency);
      }
    });
  }

  async handleNightlyJobs() {
    await this.jobRepository.queue({ name: JobName.USER_DELETE_CHECK });
    await this.jobRepository.queue({ name: JobName.PERSON_CLEANUP });
    await this.jobRepository.queue({ name: JobName.QUEUE_GENERATE_THUMBNAILS, data: { force: false } });
  }

  /**
   * Queue follow up jobs
   */
  private async onDone(item: JobItem) {
    switch (item.name) {
      case JobName.SIDECAR_SYNC:
      case JobName.SIDECAR_DISCOVERY:
        await this.jobRepository.queue({ name: JobName.METADATA_EXTRACTION, data: item.data });
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
      case JobName.ENCODE_CLIP:
      case JobName.RECOGNIZE_FACES:
      case JobName.METADATA_EXTRACTION:
        await this.jobRepository.queue({ name: JobName.SEARCH_INDEX_ASSET, data: { ids: [item.data.id] } });
        break;
    }
  }
}
