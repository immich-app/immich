import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty } from 'class-validator';
import { JobCommand, QueueName } from './job.constants';
import { Optional } from '../domain.util';

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

  @Optional()
  @IsBoolean()
  force!: boolean;
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
  [QueueName.OBJECT_TAGGING]!: JobStatusDto;

  @ApiProperty({ type: JobStatusDto })
  [QueueName.CLIP_ENCODING]!: JobStatusDto;

  @ApiProperty({ type: JobStatusDto })
  [QueueName.STORAGE_TEMPLATE_MIGRATION]!: JobStatusDto;

  @ApiProperty({ type: JobStatusDto })
  [QueueName.BACKGROUND_TASK]!: JobStatusDto;

  @ApiProperty({ type: JobStatusDto })
  [QueueName.SEARCH]!: JobStatusDto;

  @ApiProperty({ type: JobStatusDto })
  [QueueName.RECOGNIZE_FACES]!: JobStatusDto;

  @ApiProperty({ type: JobStatusDto })
  [QueueName.SIDECAR]!: JobStatusDto;
}
