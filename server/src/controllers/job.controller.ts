import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import { JobCreateDto } from 'src/dtos/job.dto';
import { QueueResponseLegacyDto, QueuesResponseLegacyDto } from 'src/dtos/queue-legacy.dto';
import { QueueCommandDto, QueueNameParamDto } from 'src/dtos/queue.dto';
import { ApiTag, Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { JobService } from 'src/services/job.service';
import { QueueService } from 'src/services/queue.service';

@ApiTags(ApiTag.Jobs)
@Controller('jobs')
export class JobController {
  constructor(
    private service: JobService,
    private queueService: QueueService,
  ) {}

  @Get()
  @Authenticated({ permission: Permission.JobRead, admin: true })
  @Endpoint({
    summary: 'Retrieve queue counts and status',
    description: 'Retrieve the counts of the current queue, as well as the current status.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2').deprecated('v2.4.0'),
  })
  getQueuesLegacy(@Auth() auth: AuthDto): Promise<QueuesResponseLegacyDto> {
    return this.queueService.getAllLegacy(auth);
  }

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

  @Put(':name')
  @Authenticated({ permission: Permission.JobCreate, admin: true })
  @Endpoint({
    summary: 'Run jobs',
    description:
      'Queue all assets for a specific job type. Defaults to only queueing assets that have not yet been processed, but the force command can be used to re-process all assets.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2').deprecated('v2.4.0'),
  })
  runQueueCommandLegacy(
    @Param() { name }: QueueNameParamDto,
    @Body() dto: QueueCommandDto,
  ): Promise<QueueResponseLegacyDto> {
    return this.queueService.runCommandLegacy(name, dto);
  }
}
