import { AllJobStatusResponseDto, JobCommandDto, JobIdDto, JobService } from '@app/domain';
import { Body, Controller, Get, Param, Put, ValidationPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Authenticated } from '../decorators/authenticated.decorator';

@ApiTags('Job')
@Controller('jobs')
@Authenticated({ admin: true })
export class JobController {
  constructor(private service: JobService) {}

  @Get()
  getAllJobsStatus(): Promise<AllJobStatusResponseDto> {
    return this.service.getAllJobsStatus();
  }

  @Put('/:jobId')
  sendJobCommand(@Param(ValidationPipe) { jobId }: JobIdDto, @Body(ValidationPipe) dto: JobCommandDto): Promise<void> {
    return this.service.handleCommand(jobId, dto);
  }
}
