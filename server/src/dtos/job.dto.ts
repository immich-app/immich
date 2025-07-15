import { ApiProperty } from '@nestjs/swagger';
import { JobCommand, ManualJobName, QueueName } from 'src/enum';
import { ValidateBoolean, ValidateEnum } from 'src/validation';

export class JobIdParamDto {
  @ValidateEnum({ enum: QueueName, name: 'JobName' })
  id!: QueueName;
}

export class JobCommandDto {
  @ValidateEnum({ enum: JobCommand, name: 'JobCommand' })
  command!: JobCommand;

  @ValidateBoolean({ optional: true })
  force?: boolean; // TODO: this uses undefined as a third state, which should be refactored to be more explicit
}

export class JobCreateDto {
  @ValidateEnum({ enum: ManualJobName, name: 'ManualJobName' })
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
  [QueueName.ThumbnailGeneration]!: JobStatusDto;

  @ApiProperty({ type: JobStatusDto })
  [QueueName.MetadataExtraction]!: JobStatusDto;

  @ApiProperty({ type: JobStatusDto })
  [QueueName.VideoConversion]!: JobStatusDto;

  @ApiProperty({ type: JobStatusDto })
  [QueueName.SmartSearch]!: JobStatusDto;

  @ApiProperty({ type: JobStatusDto })
  [QueueName.StorageTemplateMigration]!: JobStatusDto;

  @ApiProperty({ type: JobStatusDto })
  [QueueName.Migration]!: JobStatusDto;

  @ApiProperty({ type: JobStatusDto })
  [QueueName.BackgroundTask]!: JobStatusDto;

  @ApiProperty({ type: JobStatusDto })
  [QueueName.Search]!: JobStatusDto;

  @ApiProperty({ type: JobStatusDto })
  [QueueName.DuplicateDetection]!: JobStatusDto;

  @ApiProperty({ type: JobStatusDto })
  [QueueName.FaceDetection]!: JobStatusDto;

  @ApiProperty({ type: JobStatusDto })
  [QueueName.FacialRecognition]!: JobStatusDto;

  @ApiProperty({ type: JobStatusDto })
  [QueueName.Sidecar]!: JobStatusDto;

  @ApiProperty({ type: JobStatusDto })
  [QueueName.Library]!: JobStatusDto;

  @ApiProperty({ type: JobStatusDto })
  [QueueName.Notification]!: JobStatusDto;

  @ApiProperty({ type: JobStatusDto })
  [QueueName.BackupDatabase]!: JobStatusDto;
}
