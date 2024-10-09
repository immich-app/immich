export enum AuthType {
  PASSWORD = 'password',
  OAUTH = 'oauth',
}

export enum AssetType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  OTHER = 'OTHER',
}

export enum AssetFileType {
  PREVIEW = 'preview',
  THUMBNAIL = 'thumbnail',
}

export enum AlbumUserRole {
  EDITOR = 'editor',
  VIEWER = 'viewer',
}

export enum AssetOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export enum DatabaseAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export enum EntityType {
  ASSET = 'ASSET',
  ALBUM = 'ALBUM',
}

export enum MemoryType {
  /** pictures taken on this day X years ago */
  ON_THIS_DAY = 'on_this_day',
}

export enum Permission {
  ALL = 'all',

  ACTIVITY_CREATE = 'activity.create',
  ACTIVITY_READ = 'activity.read',
  ACTIVITY_UPDATE = 'activity.update',
  ACTIVITY_DELETE = 'activity.delete',
  ACTIVITY_STATISTICS = 'activity.statistics',

  API_KEY_CREATE = 'apiKey.create',
  API_KEY_READ = 'apiKey.read',
  API_KEY_UPDATE = 'apiKey.update',
  API_KEY_DELETE = 'apiKey.delete',

  // ASSET_CREATE = 'asset.create',
  ASSET_READ = 'asset.read',
  ASSET_UPDATE = 'asset.update',
  ASSET_DELETE = 'asset.delete',
  ASSET_SHARE = 'asset.share',
  ASSET_VIEW = 'asset.view',
  ASSET_DOWNLOAD = 'asset.download',
  ASSET_UPLOAD = 'asset.upload',

  ALBUM_CREATE = 'album.create',
  ALBUM_READ = 'album.read',
  ALBUM_UPDATE = 'album.update',
  ALBUM_DELETE = 'album.delete',
  ALBUM_STATISTICS = 'album.statistics',

  ALBUM_ADD_ASSET = 'album.addAsset',
  ALBUM_REMOVE_ASSET = 'album.removeAsset',
  ALBUM_SHARE = 'album.share',
  ALBUM_DOWNLOAD = 'album.download',

  AUTH_DEVICE_DELETE = 'authDevice.delete',

  ARCHIVE_READ = 'archive.read',

  FACE_CREATE = 'face.create',
  FACE_READ = 'face.read',
  FACE_UPDATE = 'face.update',
  FACE_DELETE = 'face.delete',

  LIBRARY_CREATE = 'library.create',
  LIBRARY_READ = 'library.read',
  LIBRARY_UPDATE = 'library.update',
  LIBRARY_DELETE = 'library.delete',
  LIBRARY_STATISTICS = 'library.statistics',

  TIMELINE_READ = 'timeline.read',
  TIMELINE_DOWNLOAD = 'timeline.download',

  MEMORY_CREATE = 'memory.create',
  MEMORY_READ = 'memory.read',
  MEMORY_UPDATE = 'memory.update',
  MEMORY_DELETE = 'memory.delete',

  PARTNER_CREATE = 'partner.create',
  PARTNER_READ = 'partner.read',
  PARTNER_UPDATE = 'partner.update',
  PARTNER_DELETE = 'partner.delete',

  PERSON_CREATE = 'person.create',
  PERSON_READ = 'person.read',
  PERSON_UPDATE = 'person.update',
  PERSON_DELETE = 'person.delete',
  PERSON_STATISTICS = 'person.statistics',
  PERSON_MERGE = 'person.merge',
  PERSON_REASSIGN = 'person.reassign',

  SESSION_READ = 'session.read',
  SESSION_UPDATE = 'session.update',
  SESSION_DELETE = 'session.delete',

  SHARED_LINK_CREATE = 'sharedLink.create',
  SHARED_LINK_READ = 'sharedLink.read',
  SHARED_LINK_UPDATE = 'sharedLink.update',
  SHARED_LINK_DELETE = 'sharedLink.delete',

  STACK_CREATE = 'stack.create',
  STACK_READ = 'stack.read',
  STACK_UPDATE = 'stack.update',
  STACK_DELETE = 'stack.delete',

  SYSTEM_CONFIG_READ = 'systemConfig.read',
  SYSTEM_CONFIG_UPDATE = 'systemConfig.update',

  SYSTEM_METADATA_READ = 'systemMetadata.read',
  SYSTEM_METADATA_UPDATE = 'systemMetadata.update',

  TAG_CREATE = 'tag.create',
  TAG_READ = 'tag.read',
  TAG_UPDATE = 'tag.update',
  TAG_DELETE = 'tag.delete',
  TAG_ASSET = 'tag.asset',

  ADMIN_USER_CREATE = 'admin.user.create',
  ADMIN_USER_READ = 'admin.user.read',
  ADMIN_USER_UPDATE = 'admin.user.update',
  ADMIN_USER_DELETE = 'admin.user.delete',
}

export enum SharedLinkType {
  ALBUM = 'ALBUM',

  /**
   * Individual asset
   * or group of assets that are not in an album
   */
  INDIVIDUAL = 'INDIVIDUAL',
}

export enum StorageFolder {
  ENCODED_VIDEO = 'encoded-video',
  LIBRARY = 'library',
  UPLOAD = 'upload',
  PROFILE = 'profile',
  THUMBNAILS = 'thumbs',
}

export enum SystemMetadataKey {
  REVERSE_GEOCODING_STATE = 'reverse-geocoding-state',
  FACIAL_RECOGNITION_STATE = 'facial-recognition-state',
  ADMIN_ONBOARDING = 'admin-onboarding',
  SYSTEM_CONFIG = 'system-config',
  SYSTEM_FLAGS = 'system-flags',
  VERSION_CHECK_STATE = 'version-check-state',
  LICENSE = 'license',
}

export enum UserMetadataKey {
  PREFERENCES = 'preferences',
  LICENSE = 'license',
}

export enum UserAvatarColor {
  PRIMARY = 'primary',
  PINK = 'pink',
  RED = 'red',
  YELLOW = 'yellow',
  BLUE = 'blue',
  GREEN = 'green',
  PURPLE = 'purple',
  ORANGE = 'orange',
  GRAY = 'gray',
  AMBER = 'amber',
}

export enum UserStatus {
  ACTIVE = 'active',
  REMOVING = 'removing',
  DELETED = 'deleted',
}

export enum AssetStatus {
  ACTIVE = 'active',
  TRASHED = 'trashed',
  DELETED = 'deleted',
}

export enum SourceType {
  MACHINE_LEARNING = 'machine-learning',
  EXIF = 'exif',
}

export enum ManualJobName {
  PERSON_CLEANUP = 'person-cleanup',
  TAG_CLEANUP = 'tag-cleanup',
  USER_CLEANUP = 'user-cleanup',
}

export enum AssetPathType {
  ORIGINAL = 'original',
  PREVIEW = 'preview',
  THUMBNAIL = 'thumbnail',
  ENCODED_VIDEO = 'encoded_video',
  SIDECAR = 'sidecar',
}

export enum PersonPathType {
  FACE = 'face',
}

export enum UserPathType {
  PROFILE = 'profile',
}

export type PathType = AssetPathType | PersonPathType | UserPathType;

export enum TranscodePolicy {
  ALL = 'all',
  OPTIMAL = 'optimal',
  BITRATE = 'bitrate',
  REQUIRED = 'required',
  DISABLED = 'disabled',
}

export enum TranscodeTarget {
  NONE,
  AUDIO,
  VIDEO,
  ALL,
}

export enum VideoCodec {
  H264 = 'h264',
  HEVC = 'hevc',
  VP9 = 'vp9',
  AV1 = 'av1',
}

export enum AudioCodec {
  MP3 = 'mp3',
  AAC = 'aac',
  LIBOPUS = 'libopus',
}

export enum VideoContainer {
  MOV = 'mov',
  MP4 = 'mp4',
  OGG = 'ogg',
  WEBM = 'webm',
}

export enum TranscodeHWAccel {
  NVENC = 'nvenc',
  QSV = 'qsv',
  VAAPI = 'vaapi',
  RKMPP = 'rkmpp',
  DISABLED = 'disabled',
}

export enum ToneMapping {
  HABLE = 'hable',
  MOBIUS = 'mobius',
  REINHARD = 'reinhard',
  DISABLED = 'disabled',
}

export enum CQMode {
  AUTO = 'auto',
  CQP = 'cqp',
  ICQ = 'icq',
}

export enum Colorspace {
  SRGB = 'srgb',
  P3 = 'p3',
}

export enum ImageFormat {
  JPEG = 'jpeg',
  WEBP = 'webp',
}

export enum LogLevel {
  VERBOSE = 'verbose',
  DEBUG = 'debug',
  LOG = 'log',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

export enum MetadataKey {
  AUTH_ROUTE = 'auth_route',
  ADMIN_ROUTE = 'admin_route',
  SHARED_ROUTE = 'shared_route',
  API_KEY_SECURITY = 'api_key',
  EVENT_CONFIG = 'event_config',
}

export enum RouteKey {
  ASSET = 'assets',
  USER = 'users',
}

export enum CacheControl {
  PRIVATE_WITH_CACHE = 'private_with_cache',
  PRIVATE_WITHOUT_CACHE = 'private_without_cache',
  NONE = 'none',
}

export enum PaginationMode {
  LIMIT_OFFSET = 'limit-offset',
  SKIP_TAKE = 'skip-take',
}

export enum ImmichEnvironment {
  DEVELOPMENT = 'development',
  TESTING = 'testing',
  PRODUCTION = 'production',
}

export enum ImmichWorker {
  API = 'api',
  MICROSERVICES = 'microservices',
}
