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
  SIDECAR = 'sidecar-queue',
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

  // XMP sidecars
  QUEUE_SIDECAR = 'queue-sidecar',
  SIDECAR_DISCOVERY = 'sidecar-discovery',
  SIDECAR_SYNC = 'sidecar-sync',
}

export const JOBS_ASSET_PAGINATION_SIZE = 1000;

export const JOBS_TO_QUEUE: Record<JobName, QueueName> = {
  // misc
  [JobName.ASSET_UPLOADED]: QueueName.BACKGROUND_TASK,
  [JobName.USER_DELETE_CHECK]: QueueName.BACKGROUND_TASK,
  [JobName.USER_DELETION]: QueueName.BACKGROUND_TASK,
  [JobName.DELETE_FILES]: QueueName.BACKGROUND_TASK,
  [JobName.PERSON_CLEANUP]: QueueName.BACKGROUND_TASK,

  // conversion
  [JobName.QUEUE_VIDEO_CONVERSION]: QueueName.VIDEO_CONVERSION,
  [JobName.VIDEO_CONVERSION]: QueueName.VIDEO_CONVERSION,

  // thumbnails
  [JobName.QUEUE_GENERATE_THUMBNAILS]: QueueName.THUMBNAIL_GENERATION,
  [JobName.GENERATE_JPEG_THUMBNAIL]: QueueName.THUMBNAIL_GENERATION,
  [JobName.GENERATE_WEBP_THUMBNAIL]: QueueName.THUMBNAIL_GENERATION,

  // metadata
  [JobName.QUEUE_METADATA_EXTRACTION]: QueueName.METADATA_EXTRACTION,
  [JobName.EXIF_EXTRACTION]: QueueName.METADATA_EXTRACTION,
  [JobName.EXTRACT_VIDEO_METADATA]: QueueName.METADATA_EXTRACTION,

  // storage template
  [JobName.STORAGE_TEMPLATE_MIGRATION]: QueueName.STORAGE_TEMPLATE_MIGRATION,
  [JobName.STORAGE_TEMPLATE_MIGRATION_SINGLE]: QueueName.STORAGE_TEMPLATE_MIGRATION,
  [JobName.SYSTEM_CONFIG_CHANGE]: QueueName.STORAGE_TEMPLATE_MIGRATION,

  // object tagging
  [JobName.QUEUE_OBJECT_TAGGING]: QueueName.OBJECT_TAGGING,
  [JobName.DETECT_OBJECTS]: QueueName.OBJECT_TAGGING,
  [JobName.CLASSIFY_IMAGE]: QueueName.OBJECT_TAGGING,

  // facial recognition
  [JobName.QUEUE_RECOGNIZE_FACES]: QueueName.RECOGNIZE_FACES,
  [JobName.RECOGNIZE_FACES]: QueueName.RECOGNIZE_FACES,
  [JobName.GENERATE_FACE_THUMBNAIL]: QueueName.RECOGNIZE_FACES,

  // clip
  [JobName.QUEUE_ENCODE_CLIP]: QueueName.CLIP_ENCODING,
  [JobName.ENCODE_CLIP]: QueueName.CLIP_ENCODING,

  // search - albums
  [JobName.SEARCH_INDEX_ALBUMS]: QueueName.SEARCH,
  [JobName.SEARCH_INDEX_ALBUM]: QueueName.SEARCH,
  [JobName.SEARCH_REMOVE_ALBUM]: QueueName.SEARCH,

  // search - assets
  [JobName.SEARCH_INDEX_ASSETS]: QueueName.SEARCH,
  [JobName.SEARCH_INDEX_ASSET]: QueueName.SEARCH,
  [JobName.SEARCH_REMOVE_ASSET]: QueueName.SEARCH,

  // search - faces
  [JobName.SEARCH_INDEX_FACES]: QueueName.SEARCH,
  [JobName.SEARCH_INDEX_FACE]: QueueName.SEARCH,
  [JobName.SEARCH_REMOVE_FACE]: QueueName.SEARCH,

  // XMP sidecars
  [JobName.QUEUE_SIDECAR]: QueueName.SIDECAR,
  [JobName.SIDECAR_DISCOVERY]: QueueName.SIDECAR,
  [JobName.SIDECAR_SYNC]: QueueName.SIDECAR,
};

// max concurrency for each queue (total concurrency across all jobs)
export const QUEUE_TO_CONCURRENCY: Record<QueueName, number> = {
  [QueueName.BACKGROUND_TASK]: 5,
  [QueueName.CLIP_ENCODING]: 2,
  [QueueName.METADATA_EXTRACTION]: 5,
  [QueueName.OBJECT_TAGGING]: 2,
  [QueueName.RECOGNIZE_FACES]: 2,
  [QueueName.SEARCH]: 5,
  [QueueName.SIDECAR]: 5,
  [QueueName.STORAGE_TEMPLATE_MIGRATION]: 5,
  [QueueName.THUMBNAIL_GENERATION]: 5,
  [QueueName.VIDEO_CONVERSION]: 1,
};
