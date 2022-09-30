import {
  IMetadataExtractionJob,
  IThumbnailGenerationJob,
  IVideoTranscodeJob,
  metadataExtractionQueueName,
  thumbnailGeneratorQueueName,
  videoConversionQueueName,
} from '@app/job';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { Injectable } from '@nestjs/common';
import { GetAllJobStatusResponseDto } from './response-dto/get-all-job-status-response.dto';

@Injectable()
export class JobService {
  constructor(
    @InjectQueue(thumbnailGeneratorQueueName)
    private thumbnailGeneratorQueue: Queue<IThumbnailGenerationJob>,

    @InjectQueue(metadataExtractionQueueName)
    private metadataExtractionQueue: Queue<IMetadataExtractionJob>,

    @InjectQueue(videoConversionQueueName)
    private videoConversionQueue: Queue<IVideoTranscodeJob>,
  ) {
    this.thumbnailGeneratorQueue.empty();
    this.metadataExtractionQueue.empty();
    this.videoConversionQueue.empty();
  }

  create(createJobDto: CreateJobDto) {
    return 'This action adds a new job';
  }

  async findAll(): Promise<GetAllJobStatusResponseDto> {
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
