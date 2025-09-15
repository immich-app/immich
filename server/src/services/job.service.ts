import { BadRequestException, Injectable } from '@nestjs/common';
import { ClassConstructor } from 'class-transformer';
import { snakeCase } from 'lodash';
import { SystemConfig } from 'src/config';
import { OnEvent } from 'src/decorators';
import { mapAsset } from 'src/dtos/asset-response.dto';
import { AllJobStatusResponseDto, JobCommandDto, JobCreateDto, JobStatusDto } from 'src/dtos/job.dto';
import {
  AssetType,
  AssetVisibility,
  BootstrapEventPriority,
  CronJob,
  DatabaseLock,
  ImmichWorker,
  JobCommand,
  JobName,
  JobStatus,
  ManualJobName,
  QueueCleanType,
  QueueName,
} from 'src/enum';
import { ArgOf, ArgsOf } from 'src/repositories/event.repository';
import { BaseService } from 'src/services/base.service';
import { ConcurrentQueueName, JobItem } from 'src/types';
import { hexOrBufferToBase64 } from 'src/utils/bytes';
import { handlePromiseError } from 'src/utils/misc';

const asJobItem = (dto: JobCreateDto): JobItem => {
  switch (dto.name) {
    case ManualJobName.TagCleanup: {
      return { name: JobName.TagCleanup };
    }

    case ManualJobName.PersonCleanup: {
      return { name: JobName.PersonCleanup };
    }

    case ManualJobName.UserCleanup: {
      return { name: JobName.UserDeleteCheck };
    }

    case ManualJobName.MemoryCleanup: {
      return { name: JobName.MemoryCleanup };
    }

    case ManualJobName.MemoryCreate: {
      return { name: JobName.MemoryGenerate };
    }

    case ManualJobName.BackupDatabase: {
      return { name: JobName.DatabaseBackup };
    }

    default: {
      throw new BadRequestException('Invalid job name');
    }
  }
};

const asNightlyTasksCron = (config: SystemConfig) => {
  const [hours, minutes] = config.nightlyTasks.startTime.split(':').map(Number);
  return `${minutes} ${hours} * * *`;
};

@Injectable()
export class JobService extends BaseService {
  private services: ClassConstructor<unknown>[] = [];
  private nightlyJobsLock = false;

  @OnEvent({ name: 'ConfigInit' })
  async onConfigInit({ newConfig: config }: ArgOf<'ConfigInit'>) {
    if (this.worker === ImmichWorker.Microservices) {
      this.updateQueueConcurrency(config);
      return;
    }

    this.nightlyJobsLock = await this.databaseRepository.tryLock(DatabaseLock.NightlyJobs);
    if (this.nightlyJobsLock) {
      const cronExpression = asNightlyTasksCron(config);
      this.logger.debug(`Scheduling nightly jobs for ${cronExpression}`);
      this.cronRepository.create({
        name: CronJob.NightlyJobs,
        expression: cronExpression,
        start: true,
        onTick: () => handlePromiseError(this.handleNightlyJobs(), this.logger),
      });
    }
  }

  @OnEvent({ name: 'ConfigUpdate', server: true })
  onConfigUpdate({ newConfig: config }: ArgOf<'ConfigUpdate'>) {
    if (this.worker === ImmichWorker.Microservices) {
      this.updateQueueConcurrency(config);
      return;
    }

    if (this.nightlyJobsLock) {
      const cronExpression = asNightlyTasksCron(config);
      this.logger.debug(`Scheduling nightly jobs for ${cronExpression}`);
      this.cronRepository.update({ name: CronJob.NightlyJobs, expression: cronExpression, start: true });
    }
  }

  @OnEvent({ name: 'AppBootstrap', priority: BootstrapEventPriority.JobService })
  onBootstrap() {
    this.jobRepository.setup(this.services);
    if (this.worker === ImmichWorker.Microservices) {
      this.jobRepository.startWorkers();
    }
  }

  private updateQueueConcurrency(config: SystemConfig) {
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

  setServices(services: ClassConstructor<unknown>[]) {
    this.services = services;
  }

  async create(dto: JobCreateDto): Promise<void> {
    await this.jobRepository.queue(asJobItem(dto));
  }

  async handleCommand(queueName: QueueName, dto: JobCommandDto): Promise<JobStatusDto> {
    this.logger.debug(`Handling command: queue=${queueName},command=${dto.command},force=${dto.force}`);

    switch (dto.command) {
      case JobCommand.Start: {
        await this.start(queueName, dto);
        break;
      }

      case JobCommand.Pause: {
        await this.jobRepository.pause(queueName);
        break;
      }

      case JobCommand.Resume: {
        await this.jobRepository.resume(queueName);
        break;
      }

      case JobCommand.Empty: {
        await this.jobRepository.empty(queueName);
        break;
      }

      case JobCommand.ClearFailed: {
        const failedJobs = await this.jobRepository.clear(queueName, QueueCleanType.Failed);
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

    this.telemetryRepository.jobs.addToCounter(`immich.queues.${snakeCase(name)}.started`, 1);

    switch (name) {
      case QueueName.VideoConversion: {
        return this.jobRepository.queue({ name: JobName.AssetEncodeVideoQueueAll, data: { force } });
      }

      case QueueName.StorageTemplateMigration: {
        return this.jobRepository.queue({ name: JobName.StorageTemplateMigration });
      }

      case QueueName.Migration: {
        return this.jobRepository.queue({ name: JobName.FileMigrationQueueAll });
      }

      case QueueName.SmartSearch: {
        return this.jobRepository.queue({ name: JobName.SmartSearchQueueAll, data: { force } });
      }

      case QueueName.DuplicateDetection: {
        return this.jobRepository.queue({ name: JobName.AssetDetectDuplicatesQueueAll, data: { force } });
      }

      case QueueName.MetadataExtraction: {
        return this.jobRepository.queue({ name: JobName.AssetExtractMetadataQueueAll, data: { force } });
      }

      case QueueName.Sidecar: {
        return this.jobRepository.queue({ name: JobName.SidecarQueueAll, data: { force } });
      }

      case QueueName.ThumbnailGeneration: {
        return this.jobRepository.queue({ name: JobName.AssetGenerateThumbnailsQueueAll, data: { force } });
      }

      case QueueName.FaceDetection: {
        return this.jobRepository.queue({ name: JobName.AssetDetectFacesQueueAll, data: { force } });
      }

      case QueueName.FacialRecognition: {
        return this.jobRepository.queue({ name: JobName.FacialRecognitionQueueAll, data: { force } });
      }

      case QueueName.Library: {
        return this.jobRepository.queue({ name: JobName.LibraryScanQueueAll, data: { force } });
      }

      case QueueName.BackupDatabase: {
        return this.jobRepository.queue({ name: JobName.DatabaseBackup, data: { force } });
      }

      default: {
        throw new BadRequestException(`Invalid job name: ${name}`);
      }
    }
  }

  @OnEvent({ name: 'JobStart' })
  async onJobStart(...[queueName, job]: ArgsOf<'JobStart'>) {
    const queueMetric = `immich.queues.${snakeCase(queueName)}.active`;
    this.telemetryRepository.jobs.addToGauge(queueMetric, 1);
    try {
      const status = await this.jobRepository.run(job);
      const jobMetric = `immich.jobs.${snakeCase(job.name)}.${status}`;
      this.telemetryRepository.jobs.addToCounter(jobMetric, 1);
      if (status === JobStatus.Success || status == JobStatus.Skipped) {
        await this.onDone(job);
      }
    } catch (error: Error | any) {
      await this.eventRepository.emit('JobFailed', { job, error });
    } finally {
      this.telemetryRepository.jobs.addToGauge(queueMetric, -1);
    }
  }

  private isConcurrentQueue(name: QueueName): name is ConcurrentQueueName {
    return ![
      QueueName.FacialRecognition,
      QueueName.StorageTemplateMigration,
      QueueName.DuplicateDetection,
      QueueName.BackupDatabase,
    ].includes(name);
  }

  async handleNightlyJobs() {
    const config = await this.getConfig({ withCache: false });
    const jobs: JobItem[] = [];

    if (config.nightlyTasks.databaseCleanup) {
      jobs.push(
        { name: JobName.AssetDeleteCheck },
        { name: JobName.UserDeleteCheck },
        { name: JobName.PersonCleanup },
        { name: JobName.MemoryCleanup },
        { name: JobName.SessionCleanup },
        { name: JobName.AuditTableCleanup },
        { name: JobName.AuditLogCleanup },
      );
    }

    if (config.nightlyTasks.generateMemories) {
      jobs.push({ name: JobName.MemoryGenerate });
    }

    if (config.nightlyTasks.syncQuotaUsage) {
      jobs.push({ name: JobName.UserSyncUsage });
    }

    if (config.nightlyTasks.missingThumbnails) {
      jobs.push({ name: JobName.AssetGenerateThumbnailsQueueAll, data: { force: false } });
    }

    if (config.nightlyTasks.clusterNewFaces) {
      jobs.push({ name: JobName.FacialRecognitionQueueAll, data: { force: false, nightly: true } });
    }

    await this.jobRepository.queueAll(jobs);
  }

  /**
   * Queue follow up jobs
   */
  private async onDone(item: JobItem) {
    switch (item.name) {
      case JobName.SidecarCheck: {
        await this.jobRepository.queue({ name: JobName.AssetExtractMetadata, data: item.data });
        break;
      }

      case JobName.SidecarWrite: {
        await this.jobRepository.queue({
          name: JobName.AssetExtractMetadata,
          data: { id: item.data.id, source: 'sidecar-write' },
        });
        break;
      }

      case JobName.StorageTemplateMigrationSingle: {
        if (item.data.source === 'upload' || item.data.source === 'copy') {
          await this.jobRepository.queue({ name: JobName.AssetGenerateThumbnails, data: item.data });
        }
        break;
      }

      case JobName.PersonGenerateThumbnail: {
        const { id } = item.data;
        const person = await this.personRepository.getById(id);
        if (person) {
          this.eventRepository.clientSend('on_person_thumbnail', person.ownerId, person.id);
        }
        break;
      }

      case JobName.AssetGenerateThumbnails: {
        if (!item.data.notify && item.data.source !== 'upload') {
          break;
        }

        const [asset] = await this.assetRepository.getByIdsWithAllRelationsButStacks([item.data.id]);
        if (!asset) {
          this.logger.warn(`Could not find asset ${item.data.id} after generating thumbnails`);
          break;
        }

        const jobs: JobItem[] = [
          { name: JobName.SmartSearch, data: item.data },
          { name: JobName.AssetDetectFaces, data: item.data },
        ];

        if (asset.type === AssetType.Video) {
          jobs.push({ name: JobName.AssetEncodeVideo, data: item.data });
        }

        await this.jobRepository.queueAll(jobs);
        if (asset.visibility === AssetVisibility.Timeline || asset.visibility === AssetVisibility.Archive) {
          this.eventRepository.clientSend('on_upload_success', asset.ownerId, mapAsset(asset));
          if (asset.exifInfo) {
            const exif = asset.exifInfo;
            this.eventRepository.clientSend('AssetUploadReadyV1', asset.ownerId, {
              // TODO remove `on_upload_success` and then modify the query to select only the required fields)
              asset: {
                id: asset.id,
                ownerId: asset.ownerId,
                originalFileName: asset.originalFileName,
                thumbhash: asset.thumbhash ? hexOrBufferToBase64(asset.thumbhash) : null,
                checksum: hexOrBufferToBase64(asset.checksum),
                fileCreatedAt: asset.fileCreatedAt,
                fileModifiedAt: asset.fileModifiedAt,
                localDateTime: asset.localDateTime,
                duration: asset.duration,
                type: asset.type,
                deletedAt: asset.deletedAt,
                isFavorite: asset.isFavorite,
                visibility: asset.visibility,
                livePhotoVideoId: asset.livePhotoVideoId,
                stackId: asset.stackId,
                libraryId: asset.libraryId,
              },
              exif: {
                assetId: exif.assetId,
                description: exif.description,
                exifImageWidth: exif.exifImageWidth,
                exifImageHeight: exif.exifImageHeight,
                fileSizeInByte: exif.fileSizeInByte,
                orientation: exif.orientation,
                dateTimeOriginal: exif.dateTimeOriginal,
                modifyDate: exif.modifyDate,
                timeZone: exif.timeZone,
                latitude: exif.latitude,
                longitude: exif.longitude,
                projectionType: exif.projectionType,
                city: exif.city,
                state: exif.state,
                country: exif.country,
                make: exif.make,
                model: exif.model,
                lensModel: exif.lensModel,
                fNumber: exif.fNumber,
                focalLength: exif.focalLength,
                iso: exif.iso,
                exposureTime: exif.exposureTime,
                profileDescription: exif.profileDescription,
                rating: exif.rating,
                fps: exif.fps,
              },
            });
          }
        }

        break;
      }

      case JobName.SmartSearch: {
        if (item.data.source === 'upload') {
          await this.jobRepository.queue({ name: JobName.AssetDetectDuplicates, data: item.data });
        }
        break;
      }

      case JobName.UserDelete: {
        this.eventRepository.clientBroadcast('on_user_delete', item.data.id);
        break;
      }
    }
  }
}
