import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { ClassConstructor, Transform, Type } from 'class-transformer';
import { Equals, IsBoolean, IsDefined, IsOptional, ValidateNested } from 'class-validator';
import { HistoryBuilder, Property } from 'src/decorators';
import { JobName, QueueCommand, QueueJobStatus, QueueName } from 'src/enum';
import { transformToOneOf, ValidateBoolean, ValidateEnum } from 'src/validation';

class BaseJobData {
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}

class BaseJob {
  @ValidateNested()
  @Type(() => BaseJobData)
  data!: BaseJobData;
}

class JobTagCleanup extends BaseJob {
  @ApiProperty({ enumName: JobName.TagCleanup, enum: [JobName.TagCleanup] })
  @Equals(JobName.TagCleanup)
  name!: JobName.TagCleanup;
}

class JobPersonCleanup extends BaseJob {
  @ApiProperty({ enumName: JobName.PersonCleanup, enum: [JobName.PersonCleanup] })
  @Equals(JobName.PersonCleanup)
  name!: JobName.PersonCleanup;
}

class JobUserDeleteCheck extends BaseJob {
  @ApiProperty({ enumName: JobName.UserDeleteCheck, enum: [JobName.UserDeleteCheck] })
  @Equals(JobName.UserDeleteCheck)
  name!: JobName.UserDeleteCheck;
}

class JobMemoryCleanup extends BaseJob {
  @ApiProperty({ enumName: JobName.MemoryCleanup, enum: [JobName.MemoryCleanup] })
  @Equals(JobName.MemoryCleanup)
  name!: JobName.MemoryCleanup;
}

class JobMemoryGenerate extends BaseJob {
  @ApiProperty({ enumName: JobName.MemoryGenerate, enum: [JobName.MemoryGenerate] })
  @Equals(JobName.MemoryGenerate)
  name!: JobName.MemoryGenerate;
}

class JobDatabaseBackup extends BaseJob {
  @ApiProperty({ enumName: JobName.DatabaseBackup, enum: [JobName.DatabaseBackup] })
  @Equals(JobName.DatabaseBackup)
  name!: JobName.DatabaseBackup;
}

const JOB_MAP: Record<string, ClassConstructor<object>> = {
  [JobName.TagCleanup]: JobTagCleanup,
  [JobName.PersonCleanup]: JobPersonCleanup,
  [JobName.UserDeleteCheck]: JobUserDeleteCheck,
  [JobName.MemoryCleanup]: JobMemoryCleanup,
  [JobName.MemoryGenerate]: JobMemoryGenerate,
  [JobName.DatabaseBackup]: JobDatabaseBackup,
};

@ApiExtraModels(...Object.values(JOB_MAP))
export class QueueJobCreateDto {
  @ApiProperty({
    oneOf: Object.values(JOB_MAP).map((job) => ({ $ref: getSchemaPath(job) })),
  })
  @ValidateNested()
  @Transform(transformToOneOf(JOB_MAP))
  @IsDefined({
    message: `job.name must be one of ${Object.keys(JOB_MAP)}`,
  })
  job!:
    | JobTagCleanup
    | JobPersonCleanup
    | JobUserDeleteCheck
    | JobMemoryCleanup
    | JobMemoryGenerate
    | JobDatabaseBackup;
}

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
