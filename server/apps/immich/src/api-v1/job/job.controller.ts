import { Body, Controller, Get, Param, Put, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Authenticated } from '../../decorators/authenticated.decorator';
import { AllJobStatusResponseDto } from './response-dto/all-job-status-response.dto';
import { GetJobDto } from './dto/get-job.dto';
import { JobService } from './job.service';
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

  @Put('/:jobId')
  async sendJobCommand(
    @Param(ValidationPipe) params: GetJobDto,
    @Body(ValidationPipe) dto: JobCommandDto,
  ): Promise<number> {
    if (dto.command === 'start') {
      return await this.jobService.start(params.jobId, dto.includeAllAssets);
    }
    if (dto.command === 'stop') {
      return await this.jobService.stop(params.jobId);
    }
    return 0;
  }
}
