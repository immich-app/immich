import { ApiProperty } from '@nestjs/swagger';
import { JobId } from '../dto/get-job.dto';

export class JobCounts {
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

export class AllJobStatusResponseDto {
  @ApiProperty({ type: JobCounts })
  [JobId.THUMBNAIL_GENERATION]!: JobCounts;

  @ApiProperty({ type: JobCounts })
  [JobId.METADATA_EXTRACTION]!: JobCounts;

  @ApiProperty({ type: JobCounts })
  [JobId.VIDEO_CONVERSION]!: JobCounts;

  @ApiProperty({ type: JobCounts })
  [JobId.MACHINE_LEARNING]!: JobCounts;

  @ApiProperty({ type: JobCounts })
  [JobId.STORAGE_TEMPLATE_MIGRATION]!: JobCounts;
}
