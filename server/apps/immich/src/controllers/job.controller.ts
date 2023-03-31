import { AllJobStatusResponseDto, JobCommandDto, JobIdDto, JobService } from '@app/domain';
import { Body, Controller, Get, Param, Put, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Authenticated } from '../decorators/authenticated.decorator';

@ApiTags('Job')
@Controller('jobs')
@Authenticated({ admin: true })
@UsePipes(new ValidationPipe({ transform: true }))
export class JobController {
  constructor(private service: JobService) {}

  @Get()
  getAllJobsStatus(): Promise<AllJobStatusResponseDto> {
    return this.service.getAllJobsStatus();
  }

  @Put('/:jobId')
  sendJobCommand(@Param() { jobId }: JobIdDto, @Body() dto: JobCommandDto): Promise<void> {
    return this.service.handleCommand(jobId, dto);
  }
}
