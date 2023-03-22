import { AllJobStatusResponseDto, JobCommandDto, JobIdDto, JobService } from '@app/domain';
import { Body, Controller, Get, Param, Put, ValidationPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Authenticated } from '../decorators/authenticated.decorator';

@Authenticated({ admin: true })
@ApiTags('Job')
@Controller('jobs')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Get()
  getAllJobsStatus(): Promise<AllJobStatusResponseDto> {
    return this.jobService.getAllJobsStatus();
  }

  @Put('/:jobId')
  sendJobCommand(@Param(ValidationPipe) { jobId }: JobIdDto, @Body(ValidationPipe) dto: JobCommandDto): Promise<void> {
    return this.jobService.handleCommand(jobId, dto);
  }
}
