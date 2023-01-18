export enum QueueName {
  THUMBNAIL_GENERATION = 'thumbnail-generation-queue',
  METADATA_EXTRACTION = 'metadata-extraction-queue',
  VIDEO_CONVERSION = 'video-conversion-queue',
  CHECKSUM_GENERATION = 'generate-checksum-queue',
  ASSET_UPLOADED = 'asset-uploaded-queue',
  MACHINE_LEARNING = 'machine-learning-queue',
  USER_DELETION = 'user-deletion-queue',
  CONFIG = 'config-queue',
  BACKGROUND_TASK = 'background-task',
}

export enum JobName {
  ASSET_UPLOADED = 'asset-uploaded',
  MP4_CONVERSION = 'mp4-conversion',
  GENERATE_JPEG_THUMBNAIL = 'generate-jpeg-thumbnail',
  GENERATE_WEBP_THUMBNAIL = 'generate-webp-thumbnail',
  EXIF_EXTRACTION = 'exif-extraction',
  EXTRACT_VIDEO_METADATA = 'extract-video-metadata',
  REVERSE_GEOCODING = 'reverse-geocoding',
  USER_DELETION = 'user-deletion',
  TEMPLATE_MIGRATION = 'template-migration',
  CONFIG_CHANGE = 'config-change',
  OBJECT_DETECTION = 'detect-object',
  IMAGE_TAGGING = 'tag-image',
  DELETE_FILE_ON_DISK = 'delete-file-on-disk',
}
