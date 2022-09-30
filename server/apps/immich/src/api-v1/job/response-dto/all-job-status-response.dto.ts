import Bull from 'bull';

export class AllJobStatusResponseDto {
  isThumbnailGenerationActive!: boolean;
  thumbnailGenerationQueueCount!: Bull.JobCounts;
  isMetadataExtractionActive!: boolean;
  metadataExtractionQueueCount!: Bull.JobCounts;
  isVideoConversionActive!: boolean;
  videoConversionQueueCount!: Bull.JobCounts;
}
