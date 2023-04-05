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
  QUEUE_USER_DELETE = 'queue-user-delete',
  USER_DELETE = 'user-delete',

  // storage template
  STORAGE_TEMPLATE_MIGRATION = 'storage-template-migration',
  STORAGE_TEMPLATE_MIGRATION_SINGLE = 'storage-template-migration-single',
  SYSTEM_CONFIG_CHANGE = 'system-config-change',

  // object tagging
  QUEUE_OBJECT_TAGGING = 'queue-object-tagging',
  DETECT_OBJECTS = 'detect-objects',
  CLASSIFY_IMAGE = 'classify-image',

  // cleanup
  DELETE_FILES = 'delete-files',

  // search
  SEARCH_INDEX_ASSETS = 'search-index-assets',
  SEARCH_INDEX_ASSET = 'search-index-asset',
  SEARCH_INDEX_ALBUMS = 'search-index-albums',
  SEARCH_INDEX_ALBUM = 'search-index-album',
  SEARCH_REMOVE_ALBUM = 'search-remove-album',
  SEARCH_REMOVE_ASSET = 'search-remove-asset',

  // clip
  QUEUE_ENCODE_CLIP = 'queue-clip-encode',
  ENCODE_CLIP = 'clip-encode',
}
