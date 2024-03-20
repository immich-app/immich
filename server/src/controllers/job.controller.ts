import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JobService } from 'src/domain/job/job.service';
import { AllJobStatusResponseDto, JobCommandDto, JobIdParamDto, JobStatusDto } from 'src/dtos/job.dto';
import { Authenticated } from 'src/middleware/auth.guard';

@ApiTags('Job')
@Controller('jobs')
@Authenticated({ admin: true })
export class JobController {
  constructor(private service: JobService) {}

  @Get()
  getAllJobsStatus(): Promise<AllJobStatusResponseDto> {
    return this.service.getAllJobsStatus();
  }

  @Put(':id')
  sendJobCommand(@Param() { id }: JobIdParamDto, @Body() dto: JobCommandDto): Promise<JobStatusDto> {
    return this.service.handleCommand(id, dto);
  }
}
