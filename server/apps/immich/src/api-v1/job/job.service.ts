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
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { GetAllJobStatusResponseDto } from './response-dto/get-all-job-status-response.dto';
import { randomUUID } from 'crypto';
import { ASSET_REPOSITORY, IAssetRepository } from '../asset/asset-repository';
import { AssetType } from '@app/database/entities/asset.entity';

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

  async create(createJobDto: CreateJobDto) {
    if (createJobDto.jobType === QueueNameEnum.THUMBNAIL_GENERATION) {
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

    if (createJobDto.jobType === QueueNameEnum.METADATA_EXTRACTION) {
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

    if (createJobDto.jobType === QueueNameEnum.VIDEO_CONVERSION) {
    }

    return 'This action adds a new job';
  }

  async getJobsStatus(): Promise<GetAllJobStatusResponseDto> {
    const thumbnailGeneratorJobCount = await this.thumbnailGeneratorQueue.getJobCounts();
    const metadataExtractionJobCount = await this.metadataExtractionQueue.getJobCounts();
    const videoConversionJobCount = await this.videoConversionQueue.getJobCounts();

    const response = new GetAllJobStatusResponseDto();
    response.thumbnailGenerator = Boolean(thumbnailGeneratorJobCount.waiting);
    response.metadataExtraction = Boolean(metadataExtractionJobCount.waiting);
    response.videoConversion = Boolean(videoConversionJobCount.waiting);

    return response;
  }

  async findOne(id: number) {
    return `This action returns a #${id} job`;
  }

  update(id: number, updateJobDto: UpdateJobDto) {
    return `This action updates a #${id} job`;
  }

  remove(id: number) {
    return `This action removes a #${id} job`;
  }
}
