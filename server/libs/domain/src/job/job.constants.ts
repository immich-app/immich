export enum QueueName {
  THUMBNAIL_GENERATION = 'thumbnail-generation-queue',
  METADATA_EXTRACTION = 'metadata-extraction-queue',
  VIDEO_CONVERSION = 'video-conversion-queue',
  MACHINE_LEARNING = 'machine-learning-queue',
  BACKGROUND_TASK = 'background-task',
  STORAGE_TEMPLATE_MIGRATION = 'storage-template-migration-queue',
}

export enum JobName {
  ASSET_UPLOADED = 'asset-uploaded',
  VIDEO_CONVERSION = 'mp4-conversion',
  GENERATE_JPEG_THUMBNAIL = 'generate-jpeg-thumbnail',
  GENERATE_WEBP_THUMBNAIL = 'generate-webp-thumbnail',
  EXIF_EXTRACTION = 'exif-extraction',
  EXTRACT_VIDEO_METADATA = 'extract-video-metadata',
  REVERSE_GEOCODING = 'reverse-geocoding',
  USER_DELETION = 'user-deletion',
  USER_DELETE_CHECK = 'user-delete-check',
  STORAGE_TEMPLATE_MIGRATION = 'storage-template-migration',
  SYSTEM_CONFIG_CHANGE = 'system-config-change',
  OBJECT_DETECTION = 'detect-object',
  IMAGE_TAGGING = 'tag-image',
  DELETE_FILES = 'delete-files',
}
