import { Controller, Get, Body, ValidationPipe, Put, Param } from '@nestjs/common';
import { JobService } from './job.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Authenticated } from '../../decorators/authenticated.decorator';
import { AllJobStatusResponseDto } from './response-dto/all-job-status-response.dto';
import { GetJobDto } from './dto/get-job.dto';
import { JobStatusResponseDto } from './response-dto/job-status-response.dto';

import { JobCommandDto } from './dto/job-command.dto';

@Authenticated({ admin: true })
@ApiTags('Job')
@ApiBearerAuth()
@Controller('jobs')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Get()
  getAllJobsStatus(): Promise<AllJobStatusResponseDto> {
    return this.jobService.getAllJobsStatus();
  }

  @Get('/:jobId')
  getJobStatus(@Param(ValidationPipe) params: GetJobDto): Promise<JobStatusResponseDto> {
    return this.jobService.getJobStatus(params);
  }

  @Put('/:jobId')
  async sendJobCommand(
    @Param(ValidationPipe) params: GetJobDto,
    @Body(ValidationPipe) body: JobCommandDto,
  ): Promise<number> {
    if (body.command === 'start') {
      return await this.jobService.startJob(params);
    }
    if (body.command === 'stop') {
      return await this.jobService.stopJob(params);
    }
    return 0;
  }
}
