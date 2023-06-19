import { AllJobStatusResponseDto, JobCommandDto, JobIdDto, JobService, JobStatusDto } from '@app/domain';
import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Authenticated } from '../decorators/authenticated.decorator';
import { UseValidation } from '../decorators/use-validation.decorator';

@ApiTags('Job')
@Controller('jobs')
@Authenticated({ admin: true })
@UseValidation()
export class JobController {
  constructor(private service: JobService) {}

  @Get()
  getAllJobsStatus(): Promise<AllJobStatusResponseDto> {
    return this.service.getAllJobsStatus();
  }

  @Put(':id')
  sendJobCommand(@Param() { id }: JobIdDto, @Body() dto: JobCommandDto): Promise<JobStatusDto> {
    return this.service.handleCommand(id, dto);
  }
}
