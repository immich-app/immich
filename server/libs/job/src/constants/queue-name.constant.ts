export const thumbnailGeneratorQueueName = 'thumbnail-generator-queue';
export const assetUploadedQueueName = 'asset-uploaded-queue';
export const metadataExtractionQueueName = 'metadata-extraction-queue';
export const videoConversionQueueName = 'video-conversion-queue';
export const generateChecksumQueueName = 'generate-checksum-queue';

export enum QueueNameEnum {
  THUMBNAIL_GENERATION = 'THUMBNAIL_GENERATION',
  METADATA_EXTRACTION = 'METADATA_EXTRACTION',
  VIDEO_CONVERSION = 'VIDEO_CONVERSION',
  CHECKSUM_GENERATION = 'CHECKSUM_GENERATION',
}
