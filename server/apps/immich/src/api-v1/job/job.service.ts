import {
  exifExtractionProcessorName,
  generateJPEGThumbnailProcessorName,
  IMetadataExtractionJob,
  IThumbnailGenerationJob,
  IVideoTranscodeJob,
  metadataExtractionQueueName,
  QueueNameEnum,
  thumbnailGeneratorQueueName,
  videoConversionQueueName,
  videoMetadataExtractionProcessorName,
} from '@app/job';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { AllJobStatusResponseDto } from './response-dto/all-job-status-response.dto';
import { randomUUID } from 'crypto';
import { ASSET_REPOSITORY, IAssetRepository } from '../asset/asset-repository';
import { AssetType } from '@app/database/entities/asset.entity';
import { GetJobDto } from './dto/get-job.dto';
import { JobStatusResponseDto } from './response-dto/job-status-response.dto';

@Injectable()
export class JobService {
  constructor(
    @InjectQueue(thumbnailGeneratorQueueName)
    private thumbnailGeneratorQueue: Queue<IThumbnailGenerationJob>,

    @InjectQueue(metadataExtractionQueueName)
    private metadataExtractionQueue: Queue<IMetadataExtractionJob>,

    @InjectQueue(videoConversionQueueName)
    private videoConversionQueue: Queue<IVideoTranscodeJob>,

    @Inject(ASSET_REPOSITORY)
    private _assetRepository: IAssetRepository,
  ) {
    this.thumbnailGeneratorQueue.empty();
    this.metadataExtractionQueue.empty();
    this.videoConversionQueue.empty();
  }

  async startJob(jobDto: GetJobDto): Promise<number> {
    switch (jobDto.jobId) {
      case QueueNameEnum.THUMBNAIL_GENERATION:
        return this.runThumbnailGenerationJob();
      case QueueNameEnum.METADATA_EXTRACTION:
        return this.runMetadataExtractionJob();
      case QueueNameEnum.VIDEO_CONVERSION:
        return 0;
      default:
        throw new BadRequestException('Invalid job id');
    }
  }

  async getAllJobsStatus(): Promise<AllJobStatusResponseDto> {
    const thumbnailGeneratorJobCount = await this.thumbnailGeneratorQueue.getJobCounts();
    const metadataExtractionJobCount = await this.metadataExtractionQueue.getJobCounts();
    const videoConversionJobCount = await this.videoConversionQueue.getJobCounts();

    const response = new AllJobStatusResponseDto();
    response.isThumbnailGenerationActive = Boolean(thumbnailGeneratorJobCount.waiting);
    response.thumbnailGenerationQueueCount = thumbnailGeneratorJobCount;
    response.isMetadataExtractionActive = Boolean(metadataExtractionJobCount.waiting);
    response.metadataExtractionQueueCount = metadataExtractionJobCount;
    response.isVideoConversionActive = Boolean(videoConversionJobCount.waiting);
    response.videoConversionQueueCount = videoConversionJobCount;

    return response;
  }

  async getJobStatus(query: GetJobDto): Promise<JobStatusResponseDto> {
    const response = new JobStatusResponseDto();
    if (query.jobId === QueueNameEnum.THUMBNAIL_GENERATION) {
      response.isActive = Boolean((await this.thumbnailGeneratorQueue.getJobCounts()).waiting);
      response.queueCount = await this.thumbnailGeneratorQueue.getJobCounts();
    }

    if (query.jobId === QueueNameEnum.METADATA_EXTRACTION) {
      response.isActive = Boolean((await this.metadataExtractionQueue.getJobCounts()).waiting);
      response.queueCount = await this.metadataExtractionQueue.getJobCounts();
    }

    if (query.jobId === QueueNameEnum.VIDEO_CONVERSION) {
      response.isActive = Boolean((await this.videoConversionQueue.getJobCounts()).waiting);
      response.queueCount = await this.videoConversionQueue.getJobCounts();
    }

    return response;
  }

  async stopJob(query: GetJobDto): Promise<number> {
    if (query.jobId === QueueNameEnum.THUMBNAIL_GENERATION) {
      this.thumbnailGeneratorQueue.empty();
    }

    if (query.jobId === QueueNameEnum.METADATA_EXTRACTION) {
      this.metadataExtractionQueue.empty();
    }

    if (query.jobId === QueueNameEnum.VIDEO_CONVERSION) {
      this.videoConversionQueue.empty();
    }

    return 0;
  }

  private async runThumbnailGenerationJob(): Promise<number> {
    const jobCount = await this.thumbnailGeneratorQueue.getJobCounts();

    if (jobCount.waiting > 0) {
      throw new BadRequestException('Thumbnail generation job is already running');
    }

    const assetsWithNoThumbnail = await this._assetRepository.getAssetWithNoThumbnail();

    for (const asset of assetsWithNoThumbnail) {
      await this.thumbnailGeneratorQueue.add(generateJPEGThumbnailProcessorName, { asset }, { jobId: randomUUID() });
    }

    return assetsWithNoThumbnail.length;
  }

  private async runMetadataExtractionJob(): Promise<number> {
    const jobCount = await this.metadataExtractionQueue.getJobCounts();

    if (jobCount.waiting > 0) {
      throw new BadRequestException('Metadata extraction job is already running');
    }

    const assetsWithNoExif = await this._assetRepository.getAssetWithNoEXIF();
    for (const asset of assetsWithNoExif) {
      if (asset.type === AssetType.VIDEO) {
        await this.metadataExtractionQueue.add(
          videoMetadataExtractionProcessorName,
          { asset, fileName: asset.id },
          { jobId: randomUUID() },
        );
      } else {
        await this.metadataExtractionQueue.add(
          exifExtractionProcessorName,
          { asset, fileName: asset.id },
          { jobId: randomUUID() },
        );
      }
    }
    return assetsWithNoExif.length;
  }
}
