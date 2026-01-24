import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HistoryBuilder, Property } from 'src/decorators';
import { JobName, QueueCommand, QueueJobStatus, QueueName } from 'src/enum';
import { ValidateBoolean, ValidateEnum } from 'src/validation';

export class QueueNameParamDto {
  @ApiProperty({ description: 'Queue name', enum: QueueName })
  @ValidateEnum({ enum: QueueName, name: 'QueueName' })
  name!: QueueName;
}

export class QueueCommandDto {
  @ApiProperty({ description: 'Queue command to execute', enum: QueueCommand })
  @ValidateEnum({ enum: QueueCommand, name: 'QueueCommand' })
  command!: QueueCommand;

  @ApiPropertyOptional({ description: 'Force the command execution (if applicable)', type: Boolean })
  @ValidateBoolean({ optional: true })
  force?: boolean; // TODO: this uses undefined as a third state, which should be refactored to be more explicit
}

export class QueueUpdateDto {
  @ApiPropertyOptional({ description: 'Whether to pause the queue', type: Boolean })
  @ValidateBoolean({ optional: true })
  isPaused?: boolean;
}

export class QueueDeleteDto {
  @ValidateBoolean({ optional: true })
  @Property({
    description: 'If true, will also remove failed jobs from the queue.',
    history: new HistoryBuilder().added('v2.4.0').alpha('v2.4.0'),
  })
  failed?: boolean;
}

export class QueueJobSearchDto {
  @ApiPropertyOptional({ description: 'Filter jobs by status', enum: QueueJobStatus, isArray: true })
  @ValidateEnum({ enum: QueueJobStatus, name: 'QueueJobStatus', optional: true, each: true })
  status?: QueueJobStatus[];
}
export class QueueJobResponseDto {
  @ApiPropertyOptional({ description: 'Job ID', type: String })
  id?: string;

  @ApiProperty({ description: 'Job name', enum: JobName })
  @ValidateEnum({ enum: JobName, name: 'JobName' })
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
  @ApiProperty({ description: 'Queue name', enum: QueueName })
  @ValidateEnum({ enum: QueueName, name: 'QueueName' })
  name!: QueueName;

  @ApiProperty({ description: 'Whether the queue is paused', type: Boolean })
  @ValidateBoolean()
  isPaused!: boolean;

  @ApiProperty({ description: 'Queue statistics', type: QueueStatisticsDto })
  statistics!: QueueStatisticsDto;
}
