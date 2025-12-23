import { ApiProperty } from '@nestjs/swagger';
import { HistoryBuilder, Property } from 'src/decorators';
import { JobName, QueueCommand, QueueJobStatus, QueueName } from 'src/enum';
import { ValidateBoolean, ValidateEnum } from 'src/validation';

export class QueueNameParamDto {
  @ValidateEnum({ enum: QueueName, name: 'QueueName' })
  name!: QueueName;
}

export class QueueCommandDto {
  @ValidateEnum({ enum: QueueCommand, name: 'QueueCommand' })
  command!: QueueCommand;

  @ValidateBoolean({ optional: true })
  force?: boolean; // TODO: this uses undefined as a third state, which should be refactored to be more explicit
}

export class QueueUpdateDto {
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
  @ValidateEnum({ enum: QueueJobStatus, name: 'QueueJobStatus', optional: true, each: true })
  status?: QueueJobStatus[];
}
export class QueueJobResponseDto {
  id?: string;

  @ValidateEnum({ enum: JobName, name: 'JobName' })
  name!: JobName;

  data!: object;

  @ApiProperty({ type: 'integer' })
  timestamp!: number;
}

export class QueueResponseDto {
  @ValidateEnum({ enum: QueueName, name: 'QueueName' })
  name!: QueueName;

  @ValidateBoolean()
  isPaused!: boolean;

  statistics!: QueueStatisticsDto;
}

export class QueueStatisticsDto {
  @ApiProperty({ type: 'integer' })
  active!: number;
  @ApiProperty({ type: 'integer' })
  completed!: number;
  @ApiProperty({ type: 'integer' })
  failed!: number;
  @ApiProperty({ type: 'integer' })
  delayed!: number;
  @ApiProperty({ type: 'integer' })
  waiting!: number;
  @ApiProperty({ type: 'integer' })
  paused!: number;
}
