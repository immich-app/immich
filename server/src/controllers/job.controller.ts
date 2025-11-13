import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AllJobStatusResponseDto, JobCommandDto, JobCreateDto, JobIdParamDto, JobStatusDto } from 'src/dtos/job.dto';
import { ApiTag, Permission } from 'src/enum';
import { Authenticated } from 'src/middleware/auth.guard';
import { JobService } from 'src/services/job.service';

@ApiTags(ApiTag.Jobs)
@Controller('jobs')
export class JobController {
  constructor(private service: JobService) {}

  @Get()
  @Authenticated({ permission: Permission.JobRead, admin: true })
  @ApiOperation({
    summary: 'Retrieve queue counts and status',
    description: 'Retrieve the counts of the current queue, as well as the current status.',
  })
  getAllJobsStatus(): Promise<AllJobStatusResponseDto> {
    return this.service.getAllJobsStatus();
  }

  @Post()
  @Authenticated({ permission: Permission.JobCreate, admin: true })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Create a manual job',
    description:
      'Run a specific job. Most jobs are queued automatically, but this endpoint allows for manual creation of a handful of jobs, including various cleanup tasks, as well as creating a new database backup.',
  })
  createJob(@Body() dto: JobCreateDto): Promise<void> {
    return this.service.create(dto);
  }

  @Put(':id')
  @Authenticated({ permission: Permission.JobCreate, admin: true })
  @ApiOperation({
    summary: 'Run jobs',
    description:
      'Queue all assets for a specific job type. Defaults to only queueing assets that have not yet been processed, but the force command can be used to re-process all assets.',
  })
  sendJobCommand(@Param() { id }: JobIdParamDto, @Body() dto: JobCommandDto): Promise<JobStatusDto> {
    return this.service.handleCommand(id, dto);
  }
}
