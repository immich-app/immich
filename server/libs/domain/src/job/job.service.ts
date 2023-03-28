import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { assertMachineLearningEnabled } from '../domain.constant';
import { JobCommandDto } from './dto';
import { JobCommand, JobName, QueueName } from './job.constants';
import { IJobRepository } from './job.repository';
import { AllJobStatusResponseDto } from './response-dto';

@Injectable()
export class JobService {
  private logger = new Logger(JobService.name);

  constructor(@Inject(IJobRepository) private jobRepository: IJobRepository) {}

  handleCommand(queueName: QueueName, dto: JobCommandDto): Promise<void> {
    this.logger.debug(`Handling command: queue=${queueName},force=${dto.force}`);

    switch (dto.command) {
      case JobCommand.START:
        return this.start(queueName, dto);

      case JobCommand.PAUSE:
        return this.jobRepository.pause(queueName);

      case JobCommand.RESUME:
        return this.jobRepository.resume(queueName);

      case JobCommand.EMPTY:
        return this.jobRepository.empty(queueName);
    }
  }

  async getAllJobsStatus(): Promise<AllJobStatusResponseDto> {
    const response = new AllJobStatusResponseDto();
    for (const queueName of Object.values(QueueName)) {
      response[queueName] = await this.jobRepository.getJobCounts(queueName);
    }
    return response;
  }

  private async start(name: QueueName, { force }: JobCommandDto): Promise<void> {
    const isActive = await this.jobRepository.isActive(name);
    if (isActive) {
      throw new BadRequestException(`Job is already running`);
    }

    switch (name) {
      case QueueName.VIDEO_CONVERSION:
        return this.jobRepository.queue({ name: JobName.QUEUE_VIDEO_CONVERSION, data: { force } });

      case QueueName.STORAGE_TEMPLATE_MIGRATION:
        return this.jobRepository.queue({ name: JobName.STORAGE_TEMPLATE_MIGRATION });

      case QueueName.OBJECT_TAGGING:
        assertMachineLearningEnabled();
        return this.jobRepository.queue({ name: JobName.QUEUE_OBJECT_TAGGING, data: { force } });

      case QueueName.CLIP_ENCODING:
        assertMachineLearningEnabled();
        return this.jobRepository.queue({ name: JobName.QUEUE_ENCODE_CLIP, data: { force } });

      case QueueName.METADATA_EXTRACTION:
        return this.jobRepository.queue({ name: JobName.QUEUE_METADATA_EXTRACTION, data: { force } });

      case QueueName.THUMBNAIL_GENERATION:
        return this.jobRepository.queue({ name: JobName.QUEUE_GENERATE_THUMBNAILS, data: { force } });

      default:
        throw new BadRequestException(`Invalid job name: ${name}`);
    }
  }
}
