import { ApiProperty } from '@nestjs/swagger';

export class JobCounts {
  active!: number;
  completed!: number;
  failed!: number;
  delayed!: number;
  waiting!: number;
}
export class AllJobStatusResponseDto {
  isThumbnailGenerationActive!: boolean;
  isMetadataExtractionActive!: boolean;
  isVideoConversionActive!: boolean;
  isMachineLearningActive!: boolean;

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
}
