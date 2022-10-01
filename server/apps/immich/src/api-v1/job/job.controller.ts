import { Controller, Get, Post, Body, UseGuards, ValidationPipe, Query, Put } from '@nestjs/common';
import { JobService } from './job.service';
import { CreateJobDto } from './dto/create-job.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../modules/immich-jwt/guards/jwt-auth.guard';
import { AdminRolesGuard } from '../../middlewares/admin-role-guard.middleware';
import { AllJobStatusResponseDto } from './response-dto/all-job-status-response.dto';
import { GetJobDto } from './dto/get-job.dto';
import { JobStatusResponseDto } from './response-dto/job-status-response.dto';

@UseGuards(JwtAuthGuard)
@UseGuards(AdminRolesGuard)
@ApiTags('Job')
@ApiBearerAuth()
@Controller('job')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Post()
  create(@Body(ValidationPipe) createJobDto: CreateJobDto) {
    return this.jobService.create(createJobDto);
  }

  @Get()
  getAllJobsStatus(): Promise<AllJobStatusResponseDto> {
    return this.jobService.getJobsStatus();
  }

  @Get('/one')
  getJobStatus(@Query(new ValidationPipe({ transform: true })) query: GetJobDto): Promise<JobStatusResponseDto> {
    return this.jobService.getJobStatus(query);
  }

  @Put('/stop')
  stopJob(@Query(new ValidationPipe({ transform: true })) query: GetJobDto): Promise<JobStatusResponseDto> {
    return this.jobService.stopJob(query);
  }
}
