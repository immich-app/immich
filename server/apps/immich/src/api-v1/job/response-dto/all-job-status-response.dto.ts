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

  @ApiProperty({
    type: JobCounts,
  })
  thumbnailGenerationQueueCount!: JobCounts;
  isMetadataExtractionActive!: boolean;

  @ApiProperty({
    type: JobCounts,
  })
  metadataExtractionQueueCount!: JobCounts;
  isVideoConversionActive!: boolean;

  @ApiProperty({
    type: JobCounts,
  })
  videoConversionQueueCount!: JobCounts;
}
