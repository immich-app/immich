export enum QueueName {
  THUMBNAIL_GENERATION = 'thumbnail-generation-queue',
  METADATA_EXTRACTION = 'metadata-extraction-queue',
  VIDEO_CONVERSION = 'video-conversion-queue',
  OBJECT_TAGGING = 'object-tagging-queue',
  RECOGNIZE_FACES = 'recognize-faces-queue',
  CLIP_ENCODING = 'clip-encoding-queue',
  BACKGROUND_TASK = 'background-task-queue',
  STORAGE_TEMPLATE_MIGRATION = 'storage-template-migration-queue',
  SEARCH = 'search-queue',
}

export enum JobCommand {
  START = 'start',
  PAUSE = 'pause',
  RESUME = 'resume',
  EMPTY = 'empty',
}

export enum JobName {
  // upload
  ASSET_UPLOADED = 'asset-uploaded',

  // conversion
  QUEUE_VIDEO_CONVERSION = 'queue-video-conversion',
  VIDEO_CONVERSION = 'video-conversion',

  // thumbnails
  QUEUE_GENERATE_THUMBNAILS = 'queue-generate-thumbnails',
  GENERATE_JPEG_THUMBNAIL = 'generate-jpeg-thumbnail',
  GENERATE_WEBP_THUMBNAIL = 'generate-webp-thumbnail',

  // metadata
  QUEUE_METADATA_EXTRACTION = 'queue-metadata-extraction',
  EXIF_EXTRACTION = 'exif-extraction',
  EXTRACT_VIDEO_METADATA = 'extract-video-metadata',

  // user deletion
  USER_DELETION = 'user-deletion',
  USER_DELETE_CHECK = 'user-delete-check',

  // storage template
  STORAGE_TEMPLATE_MIGRATION = 'storage-template-migration',
  STORAGE_TEMPLATE_MIGRATION_SINGLE = 'storage-template-migration-single',
  SYSTEM_CONFIG_CHANGE = 'system-config-change',

  // object tagging
  QUEUE_OBJECT_TAGGING = 'queue-object-tagging',
  DETECT_OBJECTS = 'detect-objects',
  CLASSIFY_IMAGE = 'classify-image',

  // facial recognition
  QUEUE_RECOGNIZE_FACES = 'queue-recognize-faces',
  RECOGNIZE_FACES = 'recognize-faces',
  GENERATE_FACE_THUMBNAIL = 'generate-face-thumbnail',
  PERSON_CLEANUP = 'person-cleanup',

  // cleanup
  DELETE_FILES = 'delete-files',

  // search
  SEARCH_INDEX_ASSETS = 'search-index-assets',
  SEARCH_INDEX_ASSET = 'search-index-asset',
  SEARCH_INDEX_FACE = 'search-index-face',
  SEARCH_INDEX_FACES = 'search-index-faces',
  SEARCH_INDEX_ALBUMS = 'search-index-albums',
  SEARCH_INDEX_ALBUM = 'search-index-album',
  SEARCH_REMOVE_ALBUM = 'search-remove-album',
  SEARCH_REMOVE_ASSET = 'search-remove-asset',
  SEARCH_REMOVE_FACE = 'search-remove-face',

  // clip
  QUEUE_ENCODE_CLIP = 'queue-clip-encode',
  ENCODE_CLIP = 'clip-encode',
}
