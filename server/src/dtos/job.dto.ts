import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ManualJobName } from 'src/enum';
import { JobCommand, QueueName } from 'src/interfaces/job.interface';
import { ValidateBoolean } from 'src/validation';

export class JobIdParamDto {
  @IsNotEmpty()
  @IsEnum(QueueName)
  @ApiProperty({ type: String, enum: QueueName, enumName: 'JobName' })
  id!: QueueName;
}

export class JobCommandDto {
  @IsNotEmpty()
  @IsEnum(JobCommand)
  @ApiProperty({ type: 'string', enum: JobCommand, enumName: 'JobCommand' })
  command!: JobCommand;

  @ValidateBoolean({ optional: true })
  force?: boolean; // TODO: this uses undefined as a third state, which should be refactored to be more explicit
}

export class JobCreateDto {
  @IsEnum(ManualJobName)
  @ApiProperty({ type: 'string', enum: ManualJobName, enumName: 'ManualJobName' })
  name!: ManualJobName;
}

export class JobCountsDto {
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

export class QueueStatusDto {
  isActive!: boolean;
  isPaused!: boolean;
}

export class JobStatusDto {
  @ApiProperty({ type: JobCountsDto })
  jobCounts!: JobCountsDto;

  @ApiProperty({ type: QueueStatusDto })
  queueStatus!: QueueStatusDto;
}

export class AllJobStatusResponseDto implements Record<QueueName, JobStatusDto> {
  @ApiProperty({ type: JobStatusDto })
  [QueueName.THUMBNAIL_GENERATION]!: JobStatusDto;

  @ApiProperty({ type: JobStatusDto })
  [QueueName.METADATA_EXTRACTION]!: JobStatusDto;

  @ApiProperty({ type: JobStatusDto })
  [QueueName.VIDEO_CONVERSION]!: JobStatusDto;

  @ApiProperty({ type: JobStatusDto })
  [QueueName.SMART_SEARCH]!: JobStatusDto;

  @ApiProperty({ type: JobStatusDto })
  [QueueName.STORAGE_TEMPLATE_MIGRATION]!: JobStatusDto;

  @ApiProperty({ type: JobStatusDto })
  [QueueName.MIGRATION]!: JobStatusDto;

  @ApiProperty({ type: JobStatusDto })
  [QueueName.BACKGROUND_TASK]!: JobStatusDto;

  @ApiProperty({ type: JobStatusDto })
  [QueueName.SEARCH]!: JobStatusDto;

  @ApiProperty({ type: JobStatusDto })
  [QueueName.DUPLICATE_DETECTION]!: JobStatusDto;

  @ApiProperty({ type: JobStatusDto })
  [QueueName.FACE_DETECTION]!: JobStatusDto;

  @ApiProperty({ type: JobStatusDto })
  [QueueName.FACIAL_RECOGNITION]!: JobStatusDto;

  @ApiProperty({ type: JobStatusDto })
  [QueueName.SIDECAR]!: JobStatusDto;

  @ApiProperty({ type: JobStatusDto })
  [QueueName.LIBRARY]!: JobStatusDto;

  @ApiProperty({ type: JobStatusDto })
  [QueueName.NOTIFICATION]!: JobStatusDto;

  @ApiProperty({ type: JobStatusDto })
  [QueueName.BACKUP_DATABASE]!: JobStatusDto;
}
