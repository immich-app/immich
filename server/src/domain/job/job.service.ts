import { AssetType } from '@app/infra/entities';
import { ImmichLogger } from '@app/infra/logger';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { mapAsset } from '../asset';
import {
  ClientEvent,
  IAssetRepository,
  ICommunicationRepository,
  IJobRepository,
  IPersonRepository,
  ISystemConfigRepository,
  JobHandler,
  JobItem,
  QueueCleanType,
} from '../repositories';
import { FeatureFlag, SystemConfigCore } from '../system-config/system-config.core';
import { JobCommand, JobName, QueueName } from './job.constants';
import { AllJobStatusResponseDto, JobCommandDto, JobStatusDto } from './job.dto';

@Injectable()
export class JobService {
  private logger = new ImmichLogger(JobService.name);
  private configCore: SystemConfigCore;

  constructor(
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(ICommunicationRepository) private communicationRepository: ICommunicationRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(ISystemConfigRepository) configRepository: ISystemConfigRepository,
    @Inject(IPersonRepository) private personRepository: IPersonRepository,
  ) {
    this.configCore = SystemConfigCore.create(configRepository);
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

      case JobCommand.CLEAR_FAILED:
        const failedJobs = await this.jobRepository.clear(queueName, QueueCleanType.FAILED);
        this.logger.debug(`Cleared failed jobs: ${failedJobs}`);
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

      case QueueName.MIGRATION:
        return this.jobRepository.queue({ name: JobName.QUEUE_MIGRATION });

      case QueueName.OBJECT_TAGGING:
        await this.configCore.requireFeature(FeatureFlag.TAG_IMAGE);
        return this.jobRepository.queue({ name: JobName.QUEUE_OBJECT_TAGGING, data: { force } });

      case QueueName.CLIP_ENCODING:
        await this.configCore.requireFeature(FeatureFlag.CLIP_ENCODE);
        return this.jobRepository.queue({ name: JobName.QUEUE_ENCODE_CLIP, data: { force } });

      case QueueName.METADATA_EXTRACTION:
        return this.jobRepository.queue({ name: JobName.QUEUE_METADATA_EXTRACTION, data: { force } });

      case QueueName.SIDECAR:
        await this.configCore.requireFeature(FeatureFlag.SIDECAR);
        return this.jobRepository.queue({ name: JobName.QUEUE_SIDECAR, data: { force } });

      case QueueName.THUMBNAIL_GENERATION:
        return this.jobRepository.queue({ name: JobName.QUEUE_GENERATE_THUMBNAILS, data: { force } });

      case QueueName.RECOGNIZE_FACES:
        await this.configCore.requireFeature(FeatureFlag.FACIAL_RECOGNITION);
        return this.jobRepository.queue({ name: JobName.QUEUE_RECOGNIZE_FACES, data: { force } });

      case QueueName.LIBRARY:
        return this.jobRepository.queue({ name: JobName.LIBRARY_QUEUE_SCAN_ALL, data: { force } });

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
          this.logger.error(`Unable to run job handler (${queueName}/${name}): ${error}`, error?.stack, data);
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
    await this.jobRepository.queue({ name: JobName.ASSET_DELETION_CHECK });
    await this.jobRepository.queue({ name: JobName.USER_DELETE_CHECK });
    await this.jobRepository.queue({ name: JobName.PERSON_CLEANUP });
    await this.jobRepository.queue({ name: JobName.QUEUE_GENERATE_THUMBNAILS, data: { force: false } });
    await this.jobRepository.queue({ name: JobName.CLEAN_OLD_AUDIT_LOGS });
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

      case JobName.SIDECAR_WRITE:
        await this.jobRepository.queue({
          name: JobName.METADATA_EXTRACTION,
          data: { id: item.data.id, source: 'sidecar-write' },
        });

      case JobName.METADATA_EXTRACTION:
        if (item.data.source === 'sidecar-write') {
          const [asset] = await this.assetRepository.getByIds([item.data.id]);
          if (asset) {
            this.communicationRepository.send(ClientEvent.ASSET_UPDATE, asset.ownerId, mapAsset(asset));
          }
        }
        await this.jobRepository.queue({ name: JobName.LINK_LIVE_PHOTOS, data: item.data });
        break;

      case JobName.LINK_LIVE_PHOTOS:
        await this.jobRepository.queue({ name: JobName.STORAGE_TEMPLATE_MIGRATION_SINGLE, data: item.data });
        break;

      case JobName.STORAGE_TEMPLATE_MIGRATION_SINGLE:
        if (item.data.source === 'upload') {
          await this.jobRepository.queue({ name: JobName.GENERATE_JPEG_THUMBNAIL, data: item.data });
        }
        break;

      case JobName.GENERATE_PERSON_THUMBNAIL:
        const { id } = item.data;
        const person = await this.personRepository.getById(id);
        if (person) {
          this.communicationRepository.send(ClientEvent.PERSON_THUMBNAIL, person.ownerId, person.id);
        }
        break;

      case JobName.GENERATE_JPEG_THUMBNAIL: {
        await this.jobRepository.queue({ name: JobName.GENERATE_WEBP_THUMBNAIL, data: item.data });
        await this.jobRepository.queue({ name: JobName.GENERATE_THUMBHASH_THUMBNAIL, data: item.data });
        await this.jobRepository.queue({ name: JobName.CLASSIFY_IMAGE, data: item.data });
        await this.jobRepository.queue({ name: JobName.ENCODE_CLIP, data: item.data });
        await this.jobRepository.queue({ name: JobName.RECOGNIZE_FACES, data: item.data });

        const [asset] = await this.assetRepository.getByIds([item.data.id]);
        if (asset) {
          if (asset.type === AssetType.VIDEO) {
            await this.jobRepository.queue({ name: JobName.VIDEO_CONVERSION, data: item.data });
          } else if (asset.livePhotoVideoId) {
            await this.jobRepository.queue({ name: JobName.VIDEO_CONVERSION, data: { id: asset.livePhotoVideoId } });
          }
        }
        break;
      }

      case JobName.GENERATE_WEBP_THUMBNAIL: {
        if (item.data.source !== 'upload') {
          break;
        }

        const [asset] = await this.assetRepository.getByIds([item.data.id]);

        // Only live-photo motion part will be marked as not visible immediately on upload. Skip notifying clients
        if (asset && asset.isVisible) {
          this.communicationRepository.send(ClientEvent.UPLOAD_SUCCESS, asset.ownerId, mapAsset(asset));
        }
      }
    }
  }
}
