import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  QueueDeleteDto,
  QueueJobResponseDto,
  QueueJobSearchDto,
  QueueNameParamDto,
  QueueResponseDto,
  QueueUpdateDto,
} from 'src/dtos/queue.dto';
import { ApiTag, Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { QueueService } from 'src/services/queue.service';

@ApiTags(ApiTag.Queues)
@Controller('queues')
export class QueueController {
  constructor(private service: QueueService) {}

  @Get()
  @Authenticated({ permission: Permission.QueueRead, admin: true })
  @Endpoint({
    summary: 'List all queues',
    description: 'Retrieves a list of queues.',
    history: new HistoryBuilder().added('v2.4.0').alpha('v2.4.0'),
  })
  getQueues(@Auth() auth: AuthDto): Promise<QueueResponseDto[]> {
    return this.service.getAll(auth);
  }

  @Get(':name')
  @Authenticated({ permission: Permission.QueueRead, admin: true })
  @Endpoint({
    summary: 'Retrieve a queue',
    description: 'Retrieves a specific queue by its name.',
    history: new HistoryBuilder().added('v2.4.0').alpha('v2.4.0'),
  })
  getQueue(@Auth() auth: AuthDto, @Param() { name }: QueueNameParamDto): Promise<QueueResponseDto> {
    return this.service.get(auth, name);
  }

  @Put(':name')
  @Authenticated({ permission: Permission.QueueUpdate, admin: true })
  @Endpoint({
    summary: 'Update a queue',
    description: 'Change the paused status of a specific queue.',
    history: new HistoryBuilder().added('v2.4.0').alpha('v2.4.0'),
  })
  updateQueue(
    @Auth() auth: AuthDto,
    @Param() { name }: QueueNameParamDto,
    @Body() dto: QueueUpdateDto,
  ): Promise<QueueResponseDto> {
    return this.service.update(auth, name, dto);
  }

  @Get(':name/jobs')
  @Authenticated({ permission: Permission.QueueJobRead, admin: true })
  @Endpoint({
    summary: 'Retrieve queue jobs',
    description: 'Retrieves a list of queue jobs from the specified queue.',
    history: new HistoryBuilder().added('v2.4.0').alpha('v2.4.0'),
  })
  getQueueJobs(
    @Auth() auth: AuthDto,
    @Param() { name }: QueueNameParamDto,
    @Query() dto: QueueJobSearchDto,
  ): Promise<QueueJobResponseDto[]> {
    return this.service.searchJobs(auth, name, dto);
  }

  @Delete(':name/jobs')
  @Authenticated({ permission: Permission.QueueJobDelete, admin: true })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Empty a queue',
    description: 'Removes all jobs from the specified queue.',
    history: new HistoryBuilder().added('v2.4.0').alpha('v2.4.0'),
  })
  emptyQueue(@Auth() auth: AuthDto, @Param() { name }: QueueNameParamDto, @Body() dto: QueueDeleteDto): Promise<void> {
    return this.service.emptyQueue(auth, name, dto);
  }
}
