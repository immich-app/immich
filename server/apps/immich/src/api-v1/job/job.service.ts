import { IMetadataExtractionJob, IThumbnailGenerationJob, IVideoTranscodeJob, QueueName, JobName } from '@app/job';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { AllJobStatusResponseDto } from './response-dto/all-job-status-response.dto';
import { IAssetRepository } from '../asset/asset-repository';
import { AssetType } from '@app/infra';
import { GetJobDto, JobId } from './dto/get-job.dto';
import { JobStatusResponseDto } from './response-dto/job-status-response.dto';
import { IMachineLearningJob } from '@app/job/interfaces/machine-learning.interface';
import { StorageService } from '@app/storage';
import { MACHINE_LEARNING_ENABLED } from '@app/common';

@Injectable()
export class JobService {
  constructor(
    @InjectQueue(QueueName.THUMBNAIL_GENERATION)
    private thumbnailGeneratorQueue: Queue<IThumbnailGenerationJob>,

    @InjectQueue(QueueName.METADATA_EXTRACTION)
    private metadataExtractionQueue: Queue<IMetadataExtractionJob>,

    @InjectQueue(QueueName.VIDEO_CONVERSION)
    private videoConversionQueue: Queue<IVideoTranscodeJob>,

    @InjectQueue(QueueName.MACHINE_LEARNING)
    private machineLearningQueue: Queue<IMachineLearningJob>,

    @InjectQueue(QueueName.CONFIG)
    private configQueue: Queue,

    @Inject(IAssetRepository)
    private _assetRepository: IAssetRepository,

    private storageService: StorageService,
  ) {
    this.thumbnailGeneratorQueue.empty();
    this.metadataExtractionQueue.empty();
    this.videoConversionQueue.empty();
    this.configQueue.empty();
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
      case JobId.STORAGE_TEMPLATE_MIGRATION:
        return this.runStorageMigration();
      default:
        throw new BadRequestException('Invalid job id');
    }
  }

  async getAllJobsStatus(): Promise<AllJobStatusResponseDto> {
    const thumbnailGeneratorJobCount = await this.thumbnailGeneratorQueue.getJobCounts();
    const metadataExtractionJobCount = await this.metadataExtractionQueue.getJobCounts();
    const videoConversionJobCount = await this.videoConversionQueue.getJobCounts();
    const machineLearningJobCount = await this.machineLearningQueue.getJobCounts();
    const storageMigrationJobCount = await this.configQueue.getJobCounts();

    const response = new AllJobStatusResponseDto();
    response.isThumbnailGenerationActive = Boolean(thumbnailGeneratorJobCount.waiting);
    response.thumbnailGenerationQueueCount = thumbnailGeneratorJobCount;
    response.isMetadataExtractionActive = Boolean(metadataExtractionJobCount.waiting);
    response.metadataExtractionQueueCount = metadataExtractionJobCount;
    response.isVideoConversionActive = Boolean(videoConversionJobCount.waiting);
    response.videoConversionQueueCount = videoConversionJobCount;
    response.isMachineLearningActive = Boolean(machineLearningJobCount.waiting);
    response.machineLearningQueueCount = machineLearningJobCount;

    response.isStorageMigrationActive = Boolean(storageMigrationJobCount.active);
    response.storageMigrationQueueCount = storageMigrationJobCount;

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

    if (query.jobId === JobId.STORAGE_TEMPLATE_MIGRATION) {
      response.isActive = Boolean((await this.configQueue.getJobCounts()).waiting);
      response.queueCount = await this.configQueue.getJobCounts();
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
      case JobId.STORAGE_TEMPLATE_MIGRATION:
        this.configQueue.empty();
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
      await this.thumbnailGeneratorQueue.add(JobName.GENERATE_JPEG_THUMBNAIL, { asset });
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
        await this.metadataExtractionQueue.add(JobName.EXTRACT_VIDEO_METADATA, { asset, fileName: asset.id });
      } else {
        await this.metadataExtractionQueue.add(JobName.EXIF_EXTRACTION, { asset, fileName: asset.id });
      }
    }
    return assetsWithNoExif.length;
  }

  private async runMachineLearningPipeline(): Promise<number> {
    if (!MACHINE_LEARNING_ENABLED) {
      throw new BadRequestException('Machine learning is not enabled.');
    }

    const jobCount = await this.machineLearningQueue.getJobCounts();

    if (jobCount.waiting > 0) {
      throw new BadRequestException('Metadata extraction job is already running');
    }

    const assetWithNoSmartInfo = await this._assetRepository.getAssetWithNoSmartInfo();

    for (const asset of assetWithNoSmartInfo) {
      await this.machineLearningQueue.add(JobName.IMAGE_TAGGING, { asset });
      await this.machineLearningQueue.add(JobName.OBJECT_DETECTION, { asset });
    }

    return assetWithNoSmartInfo.length;
  }

  async runStorageMigration() {
    const jobCount = await this.configQueue.getJobCounts();

    if (jobCount.active > 0) {
      throw new BadRequestException('Storage migration job is already running');
    }

    await this.configQueue.add(JobName.TEMPLATE_MIGRATION, {});

    return 1;
  }
}
