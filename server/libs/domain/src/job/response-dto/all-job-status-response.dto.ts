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
}

export class AllJobStatusResponseDto implements Record<QueueName, JobCountsDto> {
  @ApiProperty({ type: JobCountsDto })
  [QueueName.THUMBNAIL_GENERATION]!: JobCountsDto;

  @ApiProperty({ type: JobCountsDto })
  [QueueName.METADATA_EXTRACTION]!: JobCountsDto;

  @ApiProperty({ type: JobCountsDto })
  [QueueName.VIDEO_CONVERSION]!: JobCountsDto;

  @ApiProperty({ type: JobCountsDto })
  [QueueName.OBJECT_TAGGING]!: JobCountsDto;

  @ApiProperty({ type: JobCountsDto })
  [QueueName.CLIP_ENCODING]!: JobCountsDto;

  @ApiProperty({ type: JobCountsDto })
  [QueueName.STORAGE_TEMPLATE_MIGRATION]!: JobCountsDto;

  @ApiProperty({ type: JobCountsDto })
  [QueueName.BACKGROUND_TASK]!: JobCountsDto;

  @ApiProperty({ type: JobCountsDto })
  [QueueName.SEARCH]!: JobCountsDto;
}
