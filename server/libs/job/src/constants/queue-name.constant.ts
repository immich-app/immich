export const assetUploadedQueueName = 'asset-uploaded-queue';
export const metadataExtractionQueueName = 'metadata-extraction-queue';
export const videoConversionQueueName = 'video-conversion-queue';
export const generateChecksumQueueName = 'generate-checksum-queue';

export enum QueueNameEnum {
  THUMBNAIL_GENERATION = 'thumbnail-generation-queue',
  METADATA_EXTRACTION = 'metadata-extraction-queue',
  VIDEO_CONVERSION = 'video-conversion-queue',
  CHECKSUM_GENERATION = 'checksum-generation-queue',
  ASSET_UPLOADED = 'asset-uploaded-queue',
}
