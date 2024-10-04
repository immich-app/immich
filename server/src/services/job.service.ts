import { BadRequestException, Injectable } from '@nestjs/common';
import { snakeCase } from 'lodash';
import { OnEvent } from 'src/decorators';
import { mapAsset } from 'src/dtos/asset-response.dto';
import { AllJobStatusResponseDto, JobCommandDto, JobCreateDto, JobStatusDto } from 'src/dtos/job.dto';
import { AssetType, ImmichWorker, ManualJobName } from 'src/enum';
import { ArgOf } from 'src/interfaces/event.interface';
import {
  ConcurrentQueueName,
  JobCommand,
  JobHandler,
  JobItem,
  JobName,
  JobStatus,
  QueueCleanType,
  QueueName,
} from 'src/interfaces/job.interface';
import { BaseService } from 'src/services/base.service';

const asJobItem = (dto: JobCreateDto): JobItem => {
  switch (dto.name) {
    case ManualJobName.TAG_CLEANUP: {
      return { name: JobName.TAG_CLEANUP };
    }

    case ManualJobName.PERSON_CLEANUP: {
      return { name: JobName.PERSON_CLEANUP };
    }

    case ManualJobName.USER_CLEANUP: {
      return { name: JobName.USER_DELETE_CHECK };
    }

    default: {
      throw new BadRequestException('Invalid job name');
    }
  }
};

@Injectable()
export class JobService extends BaseService {
  private isMicroservices = false;

  @OnEvent({ name: 'app.bootstrap' })
  onBootstrap(app: ArgOf<'app.bootstrap'>) {
    this.isMicroservices = app === ImmichWorker.MICROSERVICES;
  }

  @OnEvent({ name: 'config.update', server: true })
  onConfigUpdate({ newConfig: config, oldConfig }: ArgOf<'config.update'>) {
    if (!oldConfig || !this.isMicroservices) {
      return;
    }

    this.logger.debug(`Updating queue concurrency settings`);
    for (const queueName of Object.values(QueueName)) {
      let concurrency = 1;
      if (this.isConcurrentQueue(queueName)) {
        concurrency = config.job[queueName].concurrency;
      }
      this.logger.debug(`Setting ${queueName} concurrency to ${concurrency}`);
      this.jobRepository.setConcurrency(queueName, concurrency);
    }
  }

  async create(dto: JobCreateDto): Promise<void> {
    await this.jobRepository.queue(asJobItem(dto));
  }

  async handleCommand(queueName: QueueName, dto: JobCommandDto): Promise<JobStatusDto> {
    this.logger.debug(`Handling command: queue=${queueName},force=${dto.force}`);

    switch (dto.command) {
      case JobCommand.START: {
        await this.start(queueName, dto);
        break;
      }

      case JobCommand.PAUSE: {
        await this.jobRepository.pause(queueName);
        break;
      }

      case JobCommand.RESUME: {
        await this.jobRepository.resume(queueName);
        break;
      }

      case JobCommand.EMPTY: {
        await this.jobRepository.empty(queueName);
        break;
      }

      case JobCommand.CLEAR_FAILED: {
        const failedJobs = await this.jobRepository.clear(queueName, QueueCleanType.FAILED);
        this.logger.debug(`Cleared failed jobs: ${failedJobs}`);
        break;
      }
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

    this.metricRepository.jobs.addToCounter(`immich.queues.${snakeCase(name)}.started`, 1);

    switch (name) {
      case QueueName.VIDEO_CONVERSION: {
        return this.jobRepository.queue({ name: JobName.QUEUE_VIDEO_CONVERSION, data: { force } });
      }

      case QueueName.STORAGE_TEMPLATE_MIGRATION: {
        return this.jobRepository.queue({ name: JobName.STORAGE_TEMPLATE_MIGRATION });
      }

      case QueueName.MIGRATION: {
        return this.jobRepository.queue({ name: JobName.QUEUE_MIGRATION });
      }

      case QueueName.SMART_SEARCH: {
        return this.jobRepository.queue({ name: JobName.QUEUE_SMART_SEARCH, data: { force } });
      }

      case QueueName.DUPLICATE_DETECTION: {
        return this.jobRepository.queue({ name: JobName.QUEUE_DUPLICATE_DETECTION, data: { force } });
      }

      case QueueName.METADATA_EXTRACTION: {
        return this.jobRepository.queue({ name: JobName.QUEUE_METADATA_EXTRACTION, data: { force } });
      }

      case QueueName.SIDECAR: {
        return this.jobRepository.queue({ name: JobName.QUEUE_SIDECAR, data: { force } });
      }

      case QueueName.THUMBNAIL_GENERATION: {
        return this.jobRepository.queue({ name: JobName.QUEUE_GENERATE_THUMBNAILS, data: { force } });
      }

      case QueueName.FACE_DETECTION: {
        return this.jobRepository.queue({ name: JobName.QUEUE_FACE_DETECTION, data: { force } });
      }

      case QueueName.FACIAL_RECOGNITION: {
        return this.jobRepository.queue({ name: JobName.QUEUE_FACIAL_RECOGNITION, data: { force } });
      }

      case QueueName.LIBRARY: {
        return this.jobRepository.queue({ name: JobName.LIBRARY_QUEUE_SYNC_ALL, data: { force } });
      }

      default: {
        throw new BadRequestException(`Invalid job name: ${name}`);
      }
    }
  }

  async init(jobHandlers: Record<JobName, JobHandler>) {
    const config = await this.getConfig({ withCache: false });
    for (const queueName of Object.values(QueueName)) {
      let concurrency = 1;

      if (this.isConcurrentQueue(queueName)) {
        concurrency = config.job[queueName].concurrency;
      }

      this.logger.debug(`Registering ${queueName} with a concurrency of ${concurrency}`);
      this.jobRepository.addHandler(queueName, concurrency, async (item: JobItem): Promise<void> => {
        const { name, data } = item;

        const handler = jobHandlers[name];
        if (!handler) {
          this.logger.warn(`Skipping unknown job: "${name}"`);
          return;
        }

        const queueMetric = `immich.queues.${snakeCase(queueName)}.active`;
        this.metricRepository.jobs.addToGauge(queueMetric, 1);

        try {
          const status = await handler(data);
          const jobMetric = `immich.jobs.${name.replaceAll('-', '_')}.${status}`;
          this.metricRepository.jobs.addToCounter(jobMetric, 1);
          if (status === JobStatus.SUCCESS || status == JobStatus.SKIPPED) {
            await this.onDone(item);
          }
        } catch (error: Error | any) {
          this.logger.error(`Unable to run job handler (${queueName}/${name}): ${error}`, error?.stack, data);
        } finally {
          this.metricRepository.jobs.addToGauge(queueMetric, -1);
        }
      });
    }
  }

  private isConcurrentQueue(name: QueueName): name is ConcurrentQueueName {
    return ![
      QueueName.FACIAL_RECOGNITION,
      QueueName.STORAGE_TEMPLATE_MIGRATION,
      QueueName.DUPLICATE_DETECTION,
    ].includes(name);
  }

  async handleNightlyJobs() {
    await this.jobRepository.queueAll([
      { name: JobName.ASSET_DELETION_CHECK },
      { name: JobName.USER_DELETE_CHECK },
      { name: JobName.PERSON_CLEANUP },
      { name: JobName.QUEUE_GENERATE_THUMBNAILS, data: { force: false } },
      { name: JobName.CLEAN_OLD_AUDIT_LOGS },
      { name: JobName.USER_SYNC_USAGE },
      { name: JobName.QUEUE_FACIAL_RECOGNITION, data: { force: false, nightly: true } },
      { name: JobName.CLEAN_OLD_SESSION_TOKENS },
    ]);
  }

  /**
   * Queue follow up jobs
   */
  private async onDone(item: JobItem) {
    switch (item.name) {
      case JobName.SIDECAR_SYNC:
      case JobName.SIDECAR_DISCOVERY: {
        await this.jobRepository.queue({ name: JobName.METADATA_EXTRACTION, data: item.data });
        break;
      }

      case JobName.SIDECAR_WRITE: {
        await this.jobRepository.queue({
          name: JobName.METADATA_EXTRACTION,
          data: { id: item.data.id, source: 'sidecar-write' },
        });
        break;
      }

      case JobName.METADATA_EXTRACTION: {
        if (item.data.source === 'sidecar-write') {
          const [asset] = await this.assetRepository.getByIdsWithAllRelations([item.data.id]);
          if (asset) {
            this.eventRepository.clientSend('on_asset_update', asset.ownerId, mapAsset(asset));
          }
        }
        await this.jobRepository.queue({ name: JobName.LINK_LIVE_PHOTOS, data: item.data });
        break;
      }

      case JobName.LINK_LIVE_PHOTOS: {
        await this.jobRepository.queue({ name: JobName.STORAGE_TEMPLATE_MIGRATION_SINGLE, data: item.data });
        break;
      }

      case JobName.STORAGE_TEMPLATE_MIGRATION_SINGLE: {
        if (item.data.source === 'upload' || item.data.source === 'copy') {
          await this.jobRepository.queue({ name: JobName.GENERATE_THUMBNAILS, data: item.data });
        }
        break;
      }

      case JobName.GENERATE_PERSON_THUMBNAIL: {
        const { id } = item.data;
        const person = await this.personRepository.getById(id);
        if (person) {
          this.eventRepository.clientSend('on_person_thumbnail', person.ownerId, person.id);
        }
        break;
      }

      case JobName.GENERATE_THUMBNAILS: {
        if (!item.data.notify && item.data.source !== 'upload') {
          break;
        }

        const [asset] = await this.assetRepository.getByIdsWithAllRelations([item.data.id]);
        if (!asset) {
          this.logger.warn(`Could not find asset ${item.data.id} after generating thumbnails`);
          break;
        }

        const jobs: JobItem[] = [
          { name: JobName.SMART_SEARCH, data: item.data },
          { name: JobName.FACE_DETECTION, data: item.data },
        ];

        if (asset.type === AssetType.VIDEO) {
          jobs.push({ name: JobName.VIDEO_CONVERSION, data: item.data });
        } else if (asset.livePhotoVideoId) {
          jobs.push({ name: JobName.VIDEO_CONVERSION, data: { id: asset.livePhotoVideoId } });
        }

        await this.jobRepository.queueAll(jobs);
        if (asset.isVisible) {
          this.eventRepository.clientSend('on_upload_success', asset.ownerId, mapAsset(asset));
        }

        break;
      }

      case JobName.SMART_SEARCH: {
        if (item.data.source === 'upload') {
          await this.jobRepository.queue({ name: JobName.DUPLICATE_DETECTION, data: item.data });
        }
        break;
      }

      case JobName.USER_DELETION: {
        this.eventRepository.clientBroadcast('on_user_delete', item.data.id);
        break;
      }
    }
  }
}
