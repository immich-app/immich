import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HistoryBuilder } from 'src/decorators';
import { JobName, QueueCommand, QueueJobStatus, QueueName } from 'src/enum';
import { ValidateBoolean, ValidateEnum } from 'src/validation';

export class QueueNameParamDto {
  @ValidateEnum({ enum: QueueName, name: 'QueueName', description: 'Queue name' })
  name!: QueueName;
}

export class QueueCommandDto {
  @ValidateEnum({ enum: QueueCommand, name: 'QueueCommand', description: 'Queue command to execute' })
  command!: QueueCommand;

  @ValidateBoolean({ optional: true, description: 'Force the command execution (if applicable)' })
  force?: boolean; // TODO: this uses undefined as a third state, which should be refactored to be more explicit
}

export class QueueUpdateDto {
  @ValidateBoolean({ optional: true, description: 'Whether to pause the queue' })
  isPaused?: boolean;
}

export class QueueDeleteDto {
  @ValidateBoolean({
    optional: true,
    description: 'If true, will also remove failed jobs from the queue.',
    history: new HistoryBuilder().added('v2.4.0').alpha('v2.4.0'),
  })
  failed?: boolean;
}

export class QueueJobSearchDto {
  @ValidateEnum({
    enum: QueueJobStatus,
    name: 'QueueJobStatus',
    optional: true,
    each: true,
    description: 'Filter jobs by status',
  })
  status?: QueueJobStatus[];
}
export class QueueJobResponseDto {
  @ApiPropertyOptional({ description: 'Job ID' })
  id?: string;

  @ValidateEnum({ enum: JobName, name: 'JobName', description: 'Job name' })
  name!: JobName;

  @ApiProperty({ description: 'Job data payload', type: Object })
  data!: object;

  @ApiProperty({ type: 'integer', description: 'Job creation timestamp' })
  timestamp!: number;
}

export class QueueStatisticsDto {
  @ApiProperty({ type: 'integer', description: 'Number of active jobs' })
  active!: number;
  @ApiProperty({ type: 'integer', description: 'Number of completed jobs' })
  completed!: number;
  @ApiProperty({ type: 'integer', description: 'Number of failed jobs' })
  failed!: number;
  @ApiProperty({ type: 'integer', description: 'Number of delayed jobs' })
  delayed!: number;
  @ApiProperty({ type: 'integer', description: 'Number of waiting jobs' })
  waiting!: number;
  @ApiProperty({ type: 'integer', description: 'Number of paused jobs' })
  paused!: number;
}

export class QueueResponseDto {
  @ValidateEnum({ enum: QueueName, name: 'QueueName', description: 'Queue name' })
  name!: QueueName;

  @ValidateBoolean({ description: 'Whether the queue is paused' })
  isPaused!: boolean;

  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  statistics!: QueueStatisticsDto;
}
