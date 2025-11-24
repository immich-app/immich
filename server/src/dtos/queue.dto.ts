import { ApiProperty } from '@nestjs/swagger';
import { QueueCommand, QueueName } from 'src/enum';
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

export class QueueStatusDto {
  isActive!: boolean;
  isPaused!: boolean;
}

export class QueueResponseDto {
  @ApiProperty({ type: QueueStatisticsDto })
  jobCounts!: QueueStatisticsDto;

  @ApiProperty({ type: QueueStatusDto })
  queueStatus!: QueueStatusDto;
}

export class QueuesResponseDto implements Record<QueueName, QueueResponseDto> {
  @ApiProperty({ type: QueueResponseDto })
  [QueueName.ThumbnailGeneration]!: QueueResponseDto;

  @ApiProperty({ type: QueueResponseDto })
  [QueueName.MetadataExtraction]!: QueueResponseDto;

  @ApiProperty({ type: QueueResponseDto })
  [QueueName.VideoConversion]!: QueueResponseDto;

  @ApiProperty({ type: QueueResponseDto })
  [QueueName.SmartSearch]!: QueueResponseDto;

  @ApiProperty({ type: QueueResponseDto })
  [QueueName.StorageTemplateMigration]!: QueueResponseDto;

  @ApiProperty({ type: QueueResponseDto })
  [QueueName.Migration]!: QueueResponseDto;

  @ApiProperty({ type: QueueResponseDto })
  [QueueName.BackgroundTask]!: QueueResponseDto;

  @ApiProperty({ type: QueueResponseDto })
  [QueueName.Search]!: QueueResponseDto;

  @ApiProperty({ type: QueueResponseDto })
  [QueueName.DuplicateDetection]!: QueueResponseDto;

  @ApiProperty({ type: QueueResponseDto })
  [QueueName.FaceDetection]!: QueueResponseDto;

  @ApiProperty({ type: QueueResponseDto })
  [QueueName.FacialRecognition]!: QueueResponseDto;

  @ApiProperty({ type: QueueResponseDto })
  [QueueName.Sidecar]!: QueueResponseDto;

  @ApiProperty({ type: QueueResponseDto })
  [QueueName.Library]!: QueueResponseDto;

  @ApiProperty({ type: QueueResponseDto })
  [QueueName.Notification]!: QueueResponseDto;

  @ApiProperty({ type: QueueResponseDto })
  [QueueName.BackupDatabase]!: QueueResponseDto;

  @ApiProperty({ type: QueueResponseDto })
  [QueueName.Ocr]!: QueueResponseDto;

  @ApiProperty({ type: QueueResponseDto })
  [QueueName.Workflow]!: QueueResponseDto;
}
