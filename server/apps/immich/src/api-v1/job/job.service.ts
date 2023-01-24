import { JobName, IJobRepository, QueueName } from '@app/domain';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { AllJobStatusResponseDto } from './response-dto/all-job-status-response.dto';
import { IAssetRepository } from '../asset/asset-repository';
import { AssetType } from '@app/infra';
import { JobId } from './dto/get-job.dto';
import { MACHINE_LEARNING_ENABLED } from '@app/common';

const jobIds = Object.values(JobId) as JobId[];

@Injectable()
export class JobService {
  constructor(
    @Inject(IAssetRepository) private _assetRepository: IAssetRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
  ) {
    for (const jobId of jobIds) {
      this.jobRepository.empty(this.asQueueName(jobId));
    }
  }

  start(jobId: JobId): Promise<number> {
    return this.run(this.asQueueName(jobId));
  }

  async stop(jobId: JobId): Promise<number> {
    await this.jobRepository.empty(this.asQueueName(jobId));
    return 0;
  }

  async getAllJobsStatus(): Promise<AllJobStatusResponseDto> {
    const response = new AllJobStatusResponseDto();
    for (const jobId of jobIds) {
      response[jobId] = await this.jobRepository.getJobCounts(this.asQueueName(jobId));
    }
    return response;
  }

  private async run(name: QueueName): Promise<number> {
    const isActive = await this.jobRepository.isActive(name);
    if (isActive) {
      throw new BadRequestException(`Job is already running`);
    }

    switch (name) {
      case QueueName.VIDEO_CONVERSION: {
        const assets = await this._assetRepository.getAssetWithNoEncodedVideo();
        for (const asset of assets) {
          await this.jobRepository.add({ name: JobName.VIDEO_CONVERSION, data: { asset } });
        }

        return assets.length;
      }

      case QueueName.CONFIG:
        await this.jobRepository.add({ name: JobName.TEMPLATE_MIGRATION });
        return 1;

      case QueueName.MACHINE_LEARNING: {
        if (!MACHINE_LEARNING_ENABLED) {
          throw new BadRequestException('Machine learning is not enabled.');
        }

        const assets = await this._assetRepository.getAssetWithNoSmartInfo();
        for (const asset of assets) {
          await this.jobRepository.add({ name: JobName.IMAGE_TAGGING, data: { asset } });
          await this.jobRepository.add({ name: JobName.OBJECT_DETECTION, data: { asset } });
        }
        return assets.length;
      }

      case QueueName.METADATA_EXTRACTION: {
        const assets = await this._assetRepository.getAssetWithNoEXIF();
        for (const asset of assets) {
          if (asset.type === AssetType.VIDEO) {
            await this.jobRepository.add({ name: JobName.EXTRACT_VIDEO_METADATA, data: { asset, fileName: asset.id } });
          } else {
            await this.jobRepository.add({ name: JobName.EXIF_EXTRACTION, data: { asset, fileName: asset.id } });
          }
        }
        return assets.length;
      }

      case QueueName.THUMBNAIL_GENERATION: {
        const assets = await this._assetRepository.getAssetWithNoThumbnail();
        for (const asset of assets) {
          await this.jobRepository.add({ name: JobName.GENERATE_JPEG_THUMBNAIL, data: { asset } });
        }
        return assets.length;
      }

      default:
        return 0;
    }
  }

  private asQueueName(jobId: JobId) {
    switch (jobId) {
      case JobId.THUMBNAIL_GENERATION:
        return QueueName.THUMBNAIL_GENERATION;

      case JobId.METADATA_EXTRACTION:
        return QueueName.METADATA_EXTRACTION;

      case JobId.VIDEO_CONVERSION:
        return QueueName.VIDEO_CONVERSION;

      case JobId.STORAGE_TEMPLATE_MIGRATION:
        return QueueName.CONFIG;

      case JobId.MACHINE_LEARNING:
        return QueueName.MACHINE_LEARNING;

      default:
        throw new BadRequestException(`Invalid job id: ${jobId}`);
    }
  }
}
