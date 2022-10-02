export const thumbnailGeneratorQueueName = 'thumbnail-generator-queue';
export const assetUploadedQueueName = 'asset-uploaded-queue';
export const metadataExtractionQueueName = 'metadata-extraction-queue';
export const videoConversionQueueName = 'video-conversion-queue';
export const generateChecksumQueueName = 'generate-checksum-queue';

export enum QueueNameEnum {
  THUMBNAIL_GENERATION = 'thumbnail-generation',
  METADATA_EXTRACTION = 'metadata-extraction',
  VIDEO_CONVERSION = 'video-conversion',
  CHECKSUM_GENERATION = 'checksum-generation',
}
