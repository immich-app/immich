import { ApiProperty } from '@nestjs/swagger';

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
  isThumbnailGenerationActive!: boolean;
  isMetadataExtractionActive!: boolean;
  isVideoConversionActive!: boolean;
  isMachineLearningActive!: boolean;
  isStorageMigrationActive!: boolean;

  @ApiProperty({
    type: JobCounts,
  })
  thumbnailGenerationQueueCount!: JobCounts;

  @ApiProperty({
    type: JobCounts,
  })
  metadataExtractionQueueCount!: JobCounts;

  @ApiProperty({
    type: JobCounts,
  })
  videoConversionQueueCount!: JobCounts;

  @ApiProperty({
    type: JobCounts,
  })
  machineLearningQueueCount!: JobCounts;

  @ApiProperty({
    type: JobCounts,
  })
  storageMigrationQueueCount!: JobCounts;
}
