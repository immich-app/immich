import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { assertMachineLearningEnabled } from '../domain.constant';
import { JobCommandDto } from './dto';
import { JobCommand, JobName } from './job.constants';
import { IJobRepository } from './job.repository';
import { AllJobStatusResponseDto, JobStatusDto } from './response-dto';

@Injectable()
export class JobService {
  private logger = new Logger(JobService.name);

  constructor(@Inject(IJobRepository) private jobRepository: IJobRepository) {}

  handleCommand(jobName: JobName, dto: JobCommandDto): Promise<void> {
    this.logger.debug(`Handling command: job=${jobName},force=${dto.force}`);

    switch (dto.command) {
      case JobCommand.START:
        return this.start(jobName, dto);

      case JobCommand.PAUSE:
        return this.jobRepository.pause(jobName);

      case JobCommand.RESUME:
        return this.jobRepository.resume(jobName);

      case JobCommand.EMPTY:
        return this.jobRepository.empty(jobName);
    }
  }

  async getJobStatus(jobName: JobName): Promise<JobStatusDto> {
    const [jobCounts, queueStatus] = await Promise.all([
      this.jobRepository.getJobCounts(jobName),
      this.jobRepository.getQueueStatus(jobName),
    ]);

    return { jobCounts, queueStatus };
  }

  async getAllJobsStatus(): Promise<AllJobStatusResponseDto> {
    const response = new AllJobStatusResponseDto();
    for (const jobName of Object.values(JobName)) {
      response[jobName] = await this.getJobStatus(jobName);
    }
    return response;
  }

  private async start(name: JobName, { force }: JobCommandDto): Promise<void> {
    const { isActive } = await this.jobRepository.getQueueStatus(name);
    if (isActive) {
      throw new BadRequestException(`Job is already running`);
    }

    switch (name) {
      case JobName.QUEUE_VIDEO_CONVERSION:
        return this.jobRepository.queue({ name: JobName.QUEUE_VIDEO_CONVERSION, data: { force } });

      case JobName.STORAGE_TEMPLATE_MIGRATION:
        return this.jobRepository.queue({ name: JobName.STORAGE_TEMPLATE_MIGRATION });

      case JobName.QUEUE_OBJECT_TAGGING:
        assertMachineLearningEnabled();
        return this.jobRepository.queue({ name: JobName.QUEUE_OBJECT_TAGGING, data: { force } });

      case JobName.QUEUE_ENCODE_CLIP:
        assertMachineLearningEnabled();
        return this.jobRepository.queue({ name: JobName.QUEUE_ENCODE_CLIP, data: { force } });

      case JobName.QUEUE_METADATA_EXTRACTION:
        return this.jobRepository.queue({ name: JobName.QUEUE_METADATA_EXTRACTION, data: { force } });

      case JobName.QUEUE_GENERATE_THUMBNAILS:
        return this.jobRepository.queue({ name: JobName.QUEUE_GENERATE_THUMBNAILS, data: { force } });

      default:
        throw new BadRequestException(`Invalid job name: ${name}`);
    }
  }
}
