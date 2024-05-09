import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AllJobStatusResponseDto, JobCommandDto, JobIdParamDto, JobStatusDto } from 'src/dtos/job.dto';
import { Authenticated } from 'src/middleware/auth.guard';
import { JobService } from 'src/services/job.service';

@ApiTags('Job')
@Controller('jobs')
export class JobController {
  constructor(private service: JobService) {}

  @Get()
  @Authenticated({ admin: true })
  getAllJobsStatus(): Promise<AllJobStatusResponseDto> {
    return this.service.getAllJobsStatus();
  }

  @Put(':id')
  @Authenticated({ admin: true })
  sendJobCommand(@Param() { id }: JobIdParamDto, @Body() dto: JobCommandDto): Promise<JobStatusDto> {
    return this.service.handleCommand(id, dto);
  }
}
