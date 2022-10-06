import {
  exifExtractionProcessorName,
  generateJPEGThumbnailProcessorName,
  IMetadataExtractionJob,
  IThumbnailGenerationJob,
  IVideoTranscodeJob,
  MachineLearningJobNameEnum,
  QueueNameEnum,
  videoMetadataExtractionProcessorName,
} from '@app/job';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { AllJobStatusResponseDto } from './response-dto/all-job-status-response.dto';
import { randomUUID } from 'crypto';
import { ASSET_REPOSITORY, IAssetRepository } from '../asset/asset-repository';
import { AssetType } from '@app/database/entities/asset.entity';
import { GetJobDto, JobId } from './dto/get-job.dto';
import { JobStatusResponseDto } from './response-dto/job-status-response.dto';
import { IMachineLearningJob } from '@app/job/interfaces/machine-learning.interface';

@Injectable()
export class JobService {
  constructor(
    @InjectQueue(QueueNameEnum.THUMBNAIL_GENERATION)
    private thumbnailGeneratorQueue: Queue<IThumbnailGenerationJob>,

    @InjectQueue(QueueNameEnum.METADATA_EXTRACTION)
    private metadataExtractionQueue: Queue<IMetadataExtractionJob>,

    @InjectQueue(QueueNameEnum.VIDEO_CONVERSION)
    private videoConversionQueue: Queue<IVideoTranscodeJob>,

    @InjectQueue(QueueNameEnum.MACHINE_LEARNING)
    private machineLearningQueue: Queue<IMachineLearningJob>,

    @Inject(ASSET_REPOSITORY)
    private _assetRepository: IAssetRepository,
  ) {
    this.thumbnailGeneratorQueue.empty();
    this.metadataExtractionQueue.empty();
    this.videoConversionQueue.empty();
  }

  async startJob(jobDto: GetJobDto): Promise<number> {
    switch (jobDto.jobId) {
      case JobId.THUMBNAIL_GENERATION:
        return this.runThumbnailGenerationJob();
      case JobId.METADATA_EXTRACTION:
        return this.runMetadataExtractionJob();
      case JobId.VIDEO_CONVERSION:
        return 0;
      case JobId.MACHINE_LEARNING:
        return this.runMachineLearningPipeline();
      default:
        throw new BadRequestException('Invalid job id');
    }
  }

  async getAllJobsStatus(): Promise<AllJobStatusResponseDto> {
    const thumbnailGeneratorJobCount = await this.thumbnailGeneratorQueue.getJobCounts();
    const metadataExtractionJobCount = await this.metadataExtractionQueue.getJobCounts();
    const videoConversionJobCount = await this.videoConversionQueue.getJobCounts();
    const machineLearningJobCount = await this.machineLearningQueue.getJobCounts();

    const response = new AllJobStatusResponseDto();
    response.isThumbnailGenerationActive = Boolean(thumbnailGeneratorJobCount.waiting);
    response.thumbnailGenerationQueueCount = thumbnailGeneratorJobCount;
    response.isMetadataExtractionActive = Boolean(metadataExtractionJobCount.waiting);
    response.metadataExtractionQueueCount = metadataExtractionJobCount;
    response.isVideoConversionActive = Boolean(videoConversionJobCount.waiting);
    response.videoConversionQueueCount = videoConversionJobCount;
    response.isMachineLearningActive = Boolean(machineLearningJobCount.waiting);
    response.machineLearningQueueCount = machineLearningJobCount;

    return response;
  }

  async getJobStatus(query: GetJobDto): Promise<JobStatusResponseDto> {
    const response = new JobStatusResponseDto();
    if (query.jobId === JobId.THUMBNAIL_GENERATION) {
      response.isActive = Boolean((await this.thumbnailGeneratorQueue.getJobCounts()).waiting);
      response.queueCount = await this.thumbnailGeneratorQueue.getJobCounts();
    }

    if (query.jobId === JobId.METADATA_EXTRACTION) {
      response.isActive = Boolean((await this.metadataExtractionQueue.getJobCounts()).waiting);
      response.queueCount = await this.metadataExtractionQueue.getJobCounts();
    }

    if (query.jobId === JobId.VIDEO_CONVERSION) {
      response.isActive = Boolean((await this.videoConversionQueue.getJobCounts()).waiting);
      response.queueCount = await this.videoConversionQueue.getJobCounts();
    }

    return response;
  }

  async stopJob(query: GetJobDto): Promise<number> {
    switch (query.jobId) {
      case JobId.THUMBNAIL_GENERATION:
        this.thumbnailGeneratorQueue.empty();
        return 0;
      case JobId.METADATA_EXTRACTION:
        this.metadataExtractionQueue.empty();
        return 0;
      case JobId.VIDEO_CONVERSION:
        this.videoConversionQueue.empty();
        return 0;
      case JobId.MACHINE_LEARNING:
        this.machineLearningQueue.empty();
        return 0;
      default:
        throw new BadRequestException('Invalid job id');
    }
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

  private async runMachineLearningPipeline(): Promise<number> {
    const jobCount = await this.machineLearningQueue.getJobCounts();

    if (jobCount.waiting > 0) {
      throw new BadRequestException('Metadata extraction job is already running');
    }

    const assetWithNoSmartInfo = await this._assetRepository.getAssetWithNoSmartInfo();

    for (const asset of assetWithNoSmartInfo) {
      await this.machineLearningQueue.add(MachineLearningJobNameEnum.IMAGE_TAGGING, { asset }, { jobId: randomUUID() });
      await this.machineLearningQueue.add(
        MachineLearningJobNameEnum.OBJECT_DETECTION,
        { asset },
        { jobId: randomUUID() },
      );
    }

    return assetWithNoSmartInfo.length;
  }
}
