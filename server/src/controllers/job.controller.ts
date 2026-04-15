import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import { JobCreateDto } from 'src/dtos/job.dto';
import { ApiTag, Permission } from 'src/enum';
import { Authenticated } from 'src/middleware/auth.guard';
import { JobService } from 'src/services/job.service';

@ApiTags(ApiTag.Jobs)
@Controller('jobs')
export class JobController {
  constructor(private service: JobService) {}

  @Post()
  @Authenticated({ permission: Permission.JobCreate, admin: true })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Create a manual job',
    description:
      'Run a specific job. Most jobs are queued automatically, but this endpoint allows for manual creation of a handful of jobs, including various cleanup tasks, as well as creating a new database backup.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  createJob(@Body() dto: JobCreateDto): Promise<void> {
    return this.service.create(dto);
  }
}
