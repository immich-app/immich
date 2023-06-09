import { ApiProperty } from '@nestjs/swagger';
import { QueueName } from '../job.constants';

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
