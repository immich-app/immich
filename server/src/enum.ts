export enum AuthType {
  Password = 'password',
  OAuth = 'oauth',
}

export enum ImmichCookie {
  AccessToken = 'immich_access_token',
  AuthType = 'immich_auth_type',
  IsAuthenticated = 'immich_is_authenticated',
  SharedLinkToken = 'immich_shared_link_token',
  OAuthState = 'immich_oauth_state',
  OAuthCodeVerifier = 'immich_oauth_code_verifier',
}

export enum ImmichHeader {
  ApiKey = 'x-api-key',
  UserToken = 'x-immich-user-token',
  SessionToken = 'x-immich-session-token',
  SharedLinkKey = 'x-immich-share-key',
  Checksum = 'x-immich-checksum',
  Cid = 'x-immich-cid',
}

export enum ImmichQuery {
  SharedLinkKey = 'key',
  ApiKey = 'apiKey',
  SessionKey = 'sessionKey',
}

export enum AssetType {
  Image = 'IMAGE',
  Video = 'VIDEO',
  Audio = 'AUDIO',
  Other = 'OTHER',
}

export enum AssetFileType {
  /**
   * An full/large-size image extracted/converted from RAW photos
   */
  FullSize = 'fullsize',
  Preview = 'preview',
  Thumbnail = 'thumbnail',
}

export enum AlbumUserRole {
  Editor = 'editor',
  Viewer = 'viewer',
}

export enum AssetOrder {
  Asc = 'asc',
  Desc = 'desc',
}

export enum DatabaseAction {
  Create = 'CREATE',
  Update = 'UPDATE',
  Delete = 'DELETE',
}

export enum EntityType {
  Asset = 'ASSET',
  Album = 'ALBUM',
}

export enum MemoryType {
  /** pictures taken on this day X years ago */
  OnThisDay = 'on_this_day',
}

export enum Permission {
  All = 'all',

  ActivityCreate = 'activity.create',
  ActivityRead = 'activity.read',
  ActivityUpdate = 'activity.update',
  ActivityDelete = 'activity.delete',
  ActivityStatistics = 'activity.statistics',

  ApiKeyCreate = 'apiKey.create',
  ApiKeyRead = 'apiKey.read',
  ApiKeyUpdate = 'apiKey.update',
  ApiKeyDelete = 'apiKey.delete',

  // ASSET_CREATE = 'asset.create',
  AssetRead = 'asset.read',
  AssetUpdate = 'asset.update',
  AssetDelete = 'asset.delete',
  AssetShare = 'asset.share',
  AssetView = 'asset.view',
  AssetDownload = 'asset.download',
  AssetUpload = 'asset.upload',

  AlbumCreate = 'album.create',
  AlbumRead = 'album.read',
  AlbumUpdate = 'album.update',
  AlbumDelete = 'album.delete',
  AlbumStatistics = 'album.statistics',

  AlbumAddAsset = 'album.addAsset',
  AlbumRemoveAsset = 'album.removeAsset',
  AlbumShare = 'album.share',
  AlbumDownload = 'album.download',

  AuthDeviceDelete = 'authDevice.delete',

  ArchiveRead = 'archive.read',

  FaceCreate = 'face.create',
  FaceRead = 'face.read',
  FaceUpdate = 'face.update',
  FaceDelete = 'face.delete',

  LibraryCreate = 'library.create',
  LibraryRead = 'library.read',
  LibraryUpdate = 'library.update',
  LibraryDelete = 'library.delete',
  LibraryStatistics = 'library.statistics',

  TimelineRead = 'timeline.read',
  TimelineDownload = 'timeline.download',

  MemoryCreate = 'memory.create',
  MemoryRead = 'memory.read',
  MemoryUpdate = 'memory.update',
  MemoryDelete = 'memory.delete',

  NotificationCreate = 'notification.create',
  NotificationRead = 'notification.read',
  NotificationUpdate = 'notification.update',
  NotificationDelete = 'notification.delete',

  PartnerCreate = 'partner.create',
  PartnerRead = 'partner.read',
  PartnerUpdate = 'partner.update',
  PartnerDelete = 'partner.delete',

  PersonCreate = 'person.create',
  PersonRead = 'person.read',
  PersonUpdate = 'person.update',
  PersonDelete = 'person.delete',
  PersonStatistics = 'person.statistics',
  PersonMerge = 'person.merge',
  PersonReassign = 'person.reassign',

  SessionCreate = 'session.create',
  SessionRead = 'session.read',
  SessionUpdate = 'session.update',
  SessionDelete = 'session.delete',
  SessionLock = 'session.lock',

  SharedLinkCreate = 'sharedLink.create',
  SharedLinkRead = 'sharedLink.read',
  SharedLinkUpdate = 'sharedLink.update',
  SharedLinkDelete = 'sharedLink.delete',

  StackCreate = 'stack.create',
  StackRead = 'stack.read',
  StackUpdate = 'stack.update',
  StackDelete = 'stack.delete',

  SystemConfigRead = 'systemConfig.read',
  SystemConfigUpdate = 'systemConfig.update',

  SystemMetadataRead = 'systemMetadata.read',
  SystemMetadataUpdate = 'systemMetadata.update',

  TagCreate = 'tag.create',
  TagRead = 'tag.read',
  TagUpdate = 'tag.update',
  TagDelete = 'tag.delete',
  TagAsset = 'tag.asset',

  AdminUserCreate = 'admin.user.create',
  AdminUserRead = 'admin.user.read',
  AdminUserUpdate = 'admin.user.update',
  AdminUserDelete = 'admin.user.delete',
}

export enum SharedLinkType {
  Album = 'ALBUM',

  /**
   * Individual asset
   * or group of assets that are not in an album
   */
  Individual = 'INDIVIDUAL',
}

export enum StorageFolder {
  EncodedVideo = 'encoded-video',
  Library = 'library',
  Upload = 'upload',
  Profile = 'profile',
  Thumbnails = 'thumbs',
  Backups = 'backups',
}

export enum SystemMetadataKey {
  ReverseGeocodingState = 'reverse-geocoding-state',
  FacialRecognitionState = 'facial-recognition-state',
  MemoriesState = 'memories-state',
  AdminOnboarding = 'admin-onboarding',
  SystemConfig = 'system-config',
  SystemFlags = 'system-flags',
  VersionCheckState = 'version-check-state',
  License = 'license',
}

export enum UserMetadataKey {
  Preferences = 'preferences',
  License = 'license',
  Onboarding = 'onboarding',
}

export enum UserAvatarColor {
  Primary = 'primary',
  Pink = 'pink',
  Red = 'red',
  Yellow = 'yellow',
  Blue = 'blue',
  Green = 'green',
  Purple = 'purple',
  Orange = 'orange',
  Gray = 'gray',
  Amber = 'amber',
}

export enum UserStatus {
  Active = 'active',
  Removing = 'removing',
  Deleted = 'deleted',
}

export enum AssetStatus {
  Active = 'active',
  Trashed = 'trashed',
  Deleted = 'deleted',
}

export enum SourceType {
  MachineLearning = 'machine-learning',
  Exif = 'exif',
  Manual = 'manual',
}

export enum ManualJobName {
  PersonCleanup = 'person-cleanup',
  TagCleanup = 'tag-cleanup',
  UserCleanup = 'user-cleanup',
  MemoryCleanup = 'memory-cleanup',
  MemoryCreate = 'memory-create',
  BackupDatabase = 'backup-database',
}

export enum AssetPathType {
  Original = 'original',
  FullSize = 'fullsize',
  Preview = 'preview',
  Thumbnail = 'thumbnail',
  EncodedVideo = 'encoded_video',
  Sidecar = 'sidecar',
}

export enum PersonPathType {
  Face = 'face',
}

export enum UserPathType {
  Profile = 'profile',
}

export type PathType = AssetPathType | PersonPathType | UserPathType;

export enum TranscodePolicy {
  All = 'all',
  Optimal = 'optimal',
  Bitrate = 'bitrate',
  Required = 'required',
  Disabled = 'disabled',
}

export enum TranscodeTarget {
  None = 'NONE',
  Audio = 'AUDIO',
  Video = 'VIDEO',
  All = 'ALL',
}

export enum VideoCodec {
  H264 = 'h264',
  Hevc = 'hevc',
  Vp9 = 'vp9',
  Av1 = 'av1',
}

export enum AudioCodec {
  Mp3 = 'mp3',
  Aac = 'aac',
  LibOpus = 'libopus',
  PcmS16le = 'pcm_s16le',
}

export enum VideoContainer {
  Mov = 'mov',
  Mp4 = 'mp4',
  Ogg = 'ogg',
  Webm = 'webm',
}

export enum TranscodeHardwareAcceleration {
  Nvenc = 'nvenc',
  Qsv = 'qsv',
  Vaapi = 'vaapi',
  Rkmpp = 'rkmpp',
  Disabled = 'disabled',
}

export enum ToneMapping {
  Hable = 'hable',
  Mobius = 'mobius',
  Reinhard = 'reinhard',
  Disabled = 'disabled',
}

export enum CQMode {
  Auto = 'auto',
  Cqp = 'cqp',
  Icq = 'icq',
}

export enum Colorspace {
  Srgb = 'srgb',
  P3 = 'p3',
}

export enum ImageFormat {
  Jpeg = 'jpeg',
  Webp = 'webp',
}

export enum RawExtractedFormat {
  Jpeg = 'jpeg',
  Jxl = 'jxl',
}

export enum LogLevel {
  Verbose = 'verbose',
  Debug = 'debug',
  Log = 'log',
  Warn = 'warn',
  Error = 'error',
  Fatal = 'fatal',
}

export enum MetadataKey {
  AuthRoute = 'auth_route',
  AdminRoute = 'admin_route',
  SharedRoute = 'shared_route',
  ApiKeySecurity = 'api_key',
  EventConfig = 'event_config',
  JobConfig = 'job_config',
  TelemetryEnabled = 'telemetry_enabled',
}

export enum RouteKey {
  Asset = 'assets',
  User = 'users',
}

export enum CacheControl {
  PrivateWithCache = 'private_with_cache',
  PrivateWithoutCache = 'private_without_cache',
  None = 'none',
}

export enum ImmichEnvironment {
  Development = 'development',
  Testing = 'testing',
  Production = 'production',
}

export enum ImmichWorker {
  Api = 'api',
  Microservices = 'microservices',
}

export enum ImmichTelemetry {
  Host = 'host',
  Api = 'api',
  Io = 'io',
  Repo = 'repo',
  Job = 'job',
}

export enum ExifOrientation {
  Horizontal = 1,
  MirrorHorizontal = 2,
  Rotate180 = 3,
  MirrorVertical = 4,
  MirrorHorizontalRotate270CW = 5,
  Rotate90CW = 6,
  MirrorHorizontalRotate90CW = 7,
  Rotate270CW = 8,
}

export enum DatabaseExtension {
  Cube = 'cube',
  EarthDistance = 'earthdistance',
  Vector = 'vector',
  Vectors = 'vectors',
  VectorChord = 'vchord',
}

export enum BootstrapEventPriority {
  // Database service should be initialized before anything else, most other services need database access
  DatabaseService = -200,
  // Other services may need to queue jobs on bootstrap.
  JobService = -190,
  // Initialise config after other bootstrap services, stop other services from using config on bootstrap
  SystemConfig = 100,
}

export enum QueueName {
  ThumbnailGeneration = 'thumbnailGeneration',
  MetadataExtraction = 'metadataExtraction',
  VideoConversion = 'videoConversion',
  FaceDetection = 'faceDetection',
  FacialRecognition = 'facialRecognition',
  SmartSearch = 'smartSearch',
  DuplicateDetection = 'duplicateDetection',
  BackgroundTask = 'backgroundTask',
  StorageTemplateMigration = 'storageTemplateMigration',
  Migration = 'migration',
  Search = 'search',
  Sidecar = 'sidecar',
  Library = 'library',
  Notification = 'notifications',
  BackupDatabase = 'backupDatabase',
}

export enum JobName {
  AssetDelete = 'AssetDelete',
  AssetDeleteCheck = 'AssetDeleteCheck',
  AssetDetectFacesQueueAll = 'AssetDetectFacesQueueAll',
  AssetDetectFaces = 'AssetDetectFaces',
  AssetDetectDuplicatesQueueAll = 'AssetDetectDuplicatesQueueAll',
  AssetDetectDuplicates = 'AssetDetectDuplicates',
  AssetEncodeVideoQueueAll = 'AssetEncodeVideoQueueAll',
  AssetEncodeVideo = 'AssetEncodeVideo',
  AssetEmptyTrash = 'AssetEmptyTrash',
  AssetExtractMetadataQueueAll = 'AssetExtractMetadataQueueAll',
  AssetExtractMetadata = 'AssetExtractMetadata',
  AssetFileMigration = 'AssetFileMigration',
  AssetGenerateThumbnailsQueueAll = 'AssetGenerateThumbnailsQueueAll',
  AssetGenerateThumbnails = 'AssetGenerateThumbnails',

  AuditLogCleanup = 'AuditLogCleanup',

  DatabaseBackup = 'DatabaseBackup',

  FacialRecognitionQueueAll = 'FacialRecognitionQueueAll',
  FacialRecognition = 'FacialRecognition',

  FileDelete = 'FileDelete',
  FileMigrationQueueAll = 'FileMigrationQueueAll',

  LibraryDeleteCheck = 'LibraryDeleteCheck',
  LibraryDelete = 'LibraryDelete',
  LibraryRemoveAsset = 'LibraryRemoveAsset',
  LibrarySyncAssetsQueueAll = 'LibraryScanAssetsQueueAll',
  LibrarySyncAssets = 'LibrarySyncAssets',
  LibrarySyncFilesQueueAll = 'LibrarySyncFilesQueueAll',
  LibrarySyncFiles = 'LibrarySyncFiles',
  LibraryScanQueueAll = 'LibraryScanQueueAll',

  MemoryCleanup = 'MemoryCleanup',
  MemoryGenerate = 'MemoryGenerate',

  NotificationsCleanup = 'NotificationsCleanup',

  NotifyUserSignup = 'NotifyUserSignup',
  NotifyAlbumInvite = 'NotifyAlbumInvite',
  NotifyAlbumUpdate = 'NotifyAlbumUpdate',

  UserDelete = 'UserDelete',
  UserDeleteCheck = 'UserDeleteCheck',
  UserSyncUsage = 'UserSyncUsage',

  PersonCleanup = 'PersonCleanup',
  PersonFileMigration = 'PersonFileMigration',
  PersonGenerateThumbnail = 'PersonGenerateThumbnail',

  SessionCleanup = 'SessionCleanup',

  SendMail = 'SendMail',

  SidecarQueueAll = 'SidecarQueueAll',
  SidecarDiscovery = 'SidecarDiscovery',
  SidecarSync = 'SidecarSync',
  SidecarWrite = 'SidecarWrite',

  SmartSearchQueueAll = 'SmartSearchQueueAll',
  SmartSearch = 'SmartSearch',

  StorageTemplateMigration = 'StorageTemplateMigration',
  StorageTemplateMigrationSingle = 'StorageTemplateMigrationSingle',

  TagCleanup = 'TagCleanup',

  VersionCheck = 'VersionCheck',
}

export enum JobCommand {
  Start = 'start',
  Pause = 'pause',
  Resume = 'resume',
  Empty = 'empty',
  ClearFailed = 'clear-failed',
}

export enum JobStatus {
  Success = 'success',
  Failed = 'failed',
  Skipped = 'skipped',
}

export enum QueueCleanType {
  Failed = 'failed',
}

export enum VectorIndex {
  Clip = 'clip_index',
  Face = 'face_index',
}

export enum DatabaseLock {
  GeodataImport = 100,
  Migrations = 200,
  SystemFileMounts = 300,
  StorageTemplateMigration = 420,
  VersionHistory = 500,
  CLIPDimSize = 512,
  Library = 1337,
  NightlyJobs = 600,
  GetSystemConfig = 69,
  BackupDatabase = 42,
  MemoryCreation = 777,
}

export enum SyncRequestType {
  AlbumsV1 = 'AlbumsV1',
  AlbumUsersV1 = 'AlbumUsersV1',
  AlbumToAssetsV1 = 'AlbumToAssetsV1',
  AlbumAssetsV1 = 'AlbumAssetsV1',
  AlbumAssetExifsV1 = 'AlbumAssetExifsV1',
  AssetsV1 = 'AssetsV1',
  AssetExifsV1 = 'AssetExifsV1',
  MemoriesV1 = 'MemoriesV1',
  MemoryToAssetsV1 = 'MemoryToAssetsV1',
  PartnersV1 = 'PartnersV1',
  PartnerAssetsV1 = 'PartnerAssetsV1',
  PartnerAssetExifsV1 = 'PartnerAssetExifsV1',
  PartnerStacksV1 = 'PartnerStacksV1',
  StacksV1 = 'StacksV1',
  UsersV1 = 'UsersV1',
  PeopleV1 = 'PeopleV1',
  UserMetadataV1 = 'UserMetadataV1',
}

export enum SyncEntityType {
  UserV1 = 'UserV1',
  UserDeleteV1 = 'UserDeleteV1',

  AssetV1 = 'AssetV1',
  AssetDeleteV1 = 'AssetDeleteV1',
  AssetExifV1 = 'AssetExifV1',

  PartnerV1 = 'PartnerV1',
  PartnerDeleteV1 = 'PartnerDeleteV1',

  PartnerAssetV1 = 'PartnerAssetV1',
  PartnerAssetBackfillV1 = 'PartnerAssetBackfillV1',
  PartnerAssetDeleteV1 = 'PartnerAssetDeleteV1',
  PartnerAssetExifV1 = 'PartnerAssetExifV1',
  PartnerAssetExifBackfillV1 = 'PartnerAssetExifBackfillV1',
  PartnerStackBackfillV1 = 'PartnerStackBackfillV1',
  PartnerStackDeleteV1 = 'PartnerStackDeleteV1',
  PartnerStackV1 = 'PartnerStackV1',

  AlbumV1 = 'AlbumV1',
  AlbumDeleteV1 = 'AlbumDeleteV1',

  AlbumUserV1 = 'AlbumUserV1',
  AlbumUserBackfillV1 = 'AlbumUserBackfillV1',
  AlbumUserDeleteV1 = 'AlbumUserDeleteV1',

  AlbumAssetV1 = 'AlbumAssetV1',
  AlbumAssetBackfillV1 = 'AlbumAssetBackfillV1',
  AlbumAssetExifV1 = 'AlbumAssetExifV1',
  AlbumAssetExifBackfillV1 = 'AlbumAssetExifBackfillV1',

  AlbumToAssetV1 = 'AlbumToAssetV1',
  AlbumToAssetDeleteV1 = 'AlbumToAssetDeleteV1',
  AlbumToAssetBackfillV1 = 'AlbumToAssetBackfillV1',

  MemoryV1 = 'MemoryV1',
  MemoryDeleteV1 = 'MemoryDeleteV1',

  MemoryToAssetV1 = 'MemoryToAssetV1',
  MemoryToAssetDeleteV1 = 'MemoryToAssetDeleteV1',

  StackV1 = 'StackV1',
  StackDeleteV1 = 'StackDeleteV1',

  PersonV1 = 'PersonV1',
  PersonDeleteV1 = 'PersonDeleteV1',

  UserMetadataV1 = 'UserMetadataV1',
  UserMetadataDeleteV1 = 'UserMetadataDeleteV1',

  SyncAckV1 = 'SyncAckV1',
  SyncResetV1 = 'SyncResetV1',
}

export enum NotificationLevel {
  Success = 'success',
  Error = 'error',
  Warning = 'warning',
  Info = 'info',
}

export enum NotificationType {
  JobFailed = 'JobFailed',
  BackupFailed = 'BackupFailed',
  SystemMessage = 'SystemMessage',
  Custom = 'Custom',
}

export enum OAuthTokenEndpointAuthMethod {
  ClientSecretPost = 'client_secret_post',
  ClientSecretBasic = 'client_secret_basic',
}

export enum DatabaseSslMode {
  Disable = 'disable',
  Allow = 'allow',
  Prefer = 'prefer',
  Require = 'require',
  VerifyFull = 'verify-full',
}

export enum AssetVisibility {
  Archive = 'archive',
  Timeline = 'timeline',

  /**
   * Video part of the LivePhotos and MotionPhotos
   */
  Hidden = 'hidden',
  Locked = 'locked',
}

export enum CronJob {
  LibraryScan = 'LibraryScan',
  NightlyJobs = 'NightlyJobs',
}
