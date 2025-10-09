import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AllJobStatusResponseDto, JobCommandDto, JobCreateDto, JobIdParamDto, JobStatusDto } from 'src/dtos/job.dto';
import { Permission } from 'src/enum';
import { Authenticated } from 'src/middleware/auth.guard';
import { JobService } from 'src/services/job.service';

@ApiTags('Jobs')
@Controller('jobs')
export class JobController {
  constructor(private service: JobService) {}

  @Get()
  @Authenticated({ permission: Permission.JobRead, admin: true })
  getAllJobsStatus(): Promise<AllJobStatusResponseDto> {
    return this.service.getAllJobsStatus();
  }

  @Post()
  @Authenticated({ permission: Permission.JobCreate, admin: true })
  @HttpCode(HttpStatus.NO_CONTENT)
  createJob(@Body() dto: JobCreateDto): Promise<void> {
    return this.service.create(dto);
  }

  @Put(':id')
  @Authenticated({ permission: Permission.JobCreate, admin: true })
  sendJobCommand(@Param() { id }: JobIdParamDto, @Body() dto: JobCommandDto): Promise<JobStatusDto> {
    return this.service.handleCommand(id, dto);
  }
}
