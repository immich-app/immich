import { AllJobStatusResponseDto, JobCommandDto, JobStatusDto, JobIdDto, JobService } from '@app/domain';
import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Authenticated } from '../decorators/authenticated.decorator';
import { UseValidation } from '../decorators/use-validation.decorator';

@ApiTags('Job')
@Controller('jobs')
@Authenticated({ admin: true })
@UseValidation()
export class JobController {
  constructor(private service: JobService) {}

  @Get()
  getAllJobsStatus(): Promise<AllJobStatusResponseDto> {
    return this.service.getAllJobsStatus();
  }

  @Put('/:jobId')
  async sendJobCommand(@Param() { jobId }: JobIdDto, @Body() dto: JobCommandDto): Promise<JobStatusDto> {
    await this.service.handleCommand(jobId, dto);
    return this.service.getJobStatus(jobId);
  }
}
