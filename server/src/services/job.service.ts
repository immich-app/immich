import { BadRequestException, Injectable } from '@nestjs/common';
import { OnEvent } from 'src/decorators';
import { mapAsset } from 'src/dtos/asset-response.dto';
import { JobCreateDto } from 'src/dtos/job.dto';
import { AssetType, AssetVisibility, JobName, JobStatus, ManualJobName, StorageBackend } from 'src/enum';
import { ArgsOf } from 'src/repositories/event.repository';
import { BaseService } from 'src/services/base.service';
import { JobItem } from 'src/types';
import { getAssetFiles } from 'src/utils/asset.util';
import { hexOrBufferToBase64 } from 'src/utils/bytes';

/**
 * Extract asset/entity ID from job data for logging purposes.
 */
const getJobEntityId = (job: JobItem): string | undefined => {
  const data = job.data as Record<string, unknown> | undefined;
  return (data?.id as string) || (data?.assetId as string) || undefined;
};

/**
 * Structured log context for job lifecycle events.
 */
interface JobLogContext {
  event: 'job_start' | 'job_complete' | 'job_failed';
  jobName: string;
  queueName: string;
  machineId: string;
  entityId?: string;
  status?: string;
  durationMs?: number;
  error?: string;
}

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

@Injectable()
export class JobService extends BaseService {
  async create(dto: JobCreateDto): Promise<void> {
    await this.jobRepository.queue(asJobItem(dto));
  }

  @OnEvent({ name: 'JobRun' })
  async onJobRun(...[queueName, job]: ArgsOf<'JobRun'>) {
    const startTime = Date.now();
    const { machineId } = this.configRepository.getEnv();
    const entityId = getJobEntityId(job);

    // Log job start at debug level (visible when LOG_LEVEL=debug)
    this.logJobEvent({
      event: 'job_start',
      jobName: job.name,
      queueName,
      machineId,
      entityId,
    });

    let response: JobStatus | undefined;
    try {
      await this.eventRepository.emit('JobStart', queueName, job);
      response = await this.jobRepository.run(job);
      await this.eventRepository.emit('JobSuccess', { job, response });
      if (response && typeof response === 'string' && [JobStatus.Success, JobStatus.Skipped].includes(response)) {
        await this.onDone(job);
      }

      // Log job complete at verbose level (visible when LOG_LEVEL=verbose)
      this.logJobEvent({
        event: 'job_complete',
        jobName: job.name,
        queueName,
        machineId,
        entityId,
        status: response,
        durationMs: Date.now() - startTime,
      });
    } catch (error: Error | any) {
      await this.eventRepository.emit('JobError', { job, error });

      // Log job failure at error level (always visible)
      this.logJobEvent({
        event: 'job_failed',
        jobName: job.name,
        queueName,
        machineId,
        entityId,
        status: JobStatus.Failed,
        durationMs: Date.now() - startTime,
        error: error?.message || String(error),
      });
    } finally {
      await this.eventRepository.emit('JobComplete', queueName, job);
    }
  }

  /**
   * Log structured job lifecycle events at appropriate log levels.
   * - job_start: debug level (visible when LOG_LEVEL=debug)
   * - job_complete: verbose level (visible when LOG_LEVEL=verbose)
   * - job_failed: error level (always visible)
   */
  private logJobEvent(context: JobLogContext): void {
    const message = this.formatJobLogMessage(context);

    switch (context.event) {
      case 'job_start': {
        this.logger.debug(message);
        break;
      }
      case 'job_complete': {
        this.logger.verbose(message);
        break;
      }
      case 'job_failed': {
        this.logger.error(message);
        break;
      }
    }
  }

  /**
   * Format job log message with structured context for Better Stack searchability.
   */
  private formatJobLogMessage(context: JobLogContext): string {
    const parts = [
      `[${context.event}]`,
      `job=${context.jobName}`,
      `queue=${context.queueName}`,
      `machine=${context.machineId}`,
    ];

    if (context.entityId) {
      parts.push(`entity=${context.entityId}`);
    }
    if (context.status) {
      parts.push(`status=${context.status}`);
    }
    if (context.durationMs !== undefined) {
      parts.push(`duration=${context.durationMs}ms`);
    }
    if (context.error) {
      parts.push(`error="${context.error}"`);
    }

    return parts.join(' ');
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
          // Inject machineId so follow-up jobs route to this machine's affinity queue
          // (we have the local file from the upload pipeline)
          const { machineId } = this.configRepository.getEnv();
          await this.jobRepository.queue({
            name: JobName.AssetGenerateThumbnails,
            data: { ...item.data, machineId },
          });
        }
        break;
      }

      case JobName.AssetExtractMetadata: {
        // For recovery jobs, queue thumbnail generation after metadata extraction
        // Inject current machineId so follow-up jobs have affinity to this machine
        // (we've already downloaded the file from S3)
        if (item.data.source === 'recovery') {
          const { machineId } = this.configRepository.getEnv();
          await this.jobRepository.queue({
            name: JobName.AssetGenerateThumbnails,
            data: { ...item.data, machineId },
          });
        }
        break;
      }

      case JobName.S3UploadAsset: {
        // S3 upload complete - no further chained jobs needed
        break;
      }

      case JobName.PersonGenerateThumbnail: {
        const { id } = item.data;
        const person = await this.personRepository.getById(id);
        if (person) {
          this.websocketRepository.clientSend('on_person_thumbnail', person.ownerId, person.id);
        }
        break;
      }

      case JobName.AssetGenerateThumbnails: {
        // With synchronous S3 upload, the original file is already in S3 at upload time.
        // No need to queue S3UploadAsset here anymore.

        // For fresh uploads and recovery jobs, queue follow-up processing jobs
        const isProcessingJob = item.data.source === 'upload' || item.data.source === 'recovery';
        if (!item.data.notify && !isProcessingJob) {
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
          { name: JobName.Ocr, data: item.data },
        ];

        if (asset.type === AssetType.Video) {
          // Video: keep temp file for encoding, cleanup happens after encoding
          jobs.push({ name: JobName.AssetEncodeVideo, data: item.data });
        } else if ((item.data.source === 'upload' || item.data.source === 'recovery') && item.data.localPath) {
          // Photo: cleanup temp file now (all processing complete)
          try {
            await this.storageRepository.unlink(item.data.localPath);
            this.logger.debug(`Cleaned up temp file for asset ${item.data.id}: ${item.data.localPath}`);
          } catch (error) {
            this.logger.debug(`Temp file cleanup skipped (may already be deleted): ${item.data.localPath}`, error);
          }
        }

        await this.jobRepository.queueAll(jobs);
        if (asset.visibility === AssetVisibility.Timeline || asset.visibility === AssetVisibility.Archive) {
          this.websocketRepository.clientSend('on_upload_success', asset.ownerId, mapAsset(asset));
          if (asset.exifInfo) {
            const exif = asset.exifInfo;
            this.websocketRepository.clientSend('AssetUploadReadyV1', asset.ownerId, {
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

      // Face detection complete - no additional jobs needed
      case JobName.AssetDetectFaces: {
        break;
      }

      // OCR complete - cleanup local thumbnails/previews if backed by S3
      case JobName.Ocr: {
        await this.cleanupLocalThumbnails(item.data.id);
        break;
      }

      // Video encoding complete
      // S3 upload for the original is now done before thumbnail generation
      // The encoded video still needs its own upload (handled separately)
      case JobName.AssetEncodeVideo: {
        // Video encoding complete - cleanup temp file for upload and recovery jobs
        const localPath = item.data.localPath;
        const shouldCleanup = (item.data.source === 'upload' || item.data.source === 'recovery') && localPath;
        if (shouldCleanup) {
          try {
            await this.storageRepository.unlink(localPath);
            this.logger.debug(`Cleaned up temp file for video ${item.data.id}: ${localPath}`);
          } catch (error) {
            this.logger.debug(`Temp file cleanup skipped (may already be deleted): ${localPath}`, error);
          }
        }
        break;
      }
    }
  }

  /**
   * Cleanup local thumbnail/preview files after ML jobs complete.
   * Only deletes if the files are backed by S3 (already uploaded).
   */
  private async cleanupLocalThumbnails(assetId: string): Promise<void> {
    try {
      const asset = await this.assetRepository.getById(assetId, { files: true });
      if (!asset?.files) {
        return;
      }

      const { previewFile, thumbnailFile } = getAssetFiles(asset.files);

      // Delete local preview if backed by S3
      if (previewFile?.storageBackend === StorageBackend.S3 && previewFile.path) {
        try {
          await this.storageRepository.unlink(previewFile.path);
          this.logger.debug(`Cleaned up local preview for asset ${assetId}`);
        } catch {
          // File may already be deleted, ignore
        }
      }

      // Delete local thumbnail if backed by S3
      if (thumbnailFile?.storageBackend === StorageBackend.S3 && thumbnailFile.path) {
        try {
          await this.storageRepository.unlink(thumbnailFile.path);
          this.logger.debug(`Cleaned up local thumbnail for asset ${assetId}`);
        } catch {
          // File may already be deleted, ignore
        }
      }
    } catch (error) {
      this.logger.debug(`Thumbnail cleanup skipped for asset ${assetId}`, error);
    }
  }
}
