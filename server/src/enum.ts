import z from 'zod';

export enum AuthType {
  Password = 'password',
  OAuth = 'oauth',
}

export enum ImmichCookie {
  AccessToken = 'immich_access_token',
  MaintenanceToken = 'immich_maintenance_token',
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
  SharedLinkSlug = 'x-immich-share-slug',
  Checksum = 'x-immich-checksum',
  CorrelationId = 'X-Correlation-ID',
}

export enum ImmichQuery {
  SharedLinkKey = 'key',
  SharedLinkSlug = 'slug',
  ApiKey = 'apiKey',
  SessionKey = 'sessionKey',
}

export enum AssetType {
  Image = 'IMAGE',
  Video = 'VIDEO',
  Audio = 'AUDIO',
  Other = 'OTHER',
}

export const AssetTypeSchema = z.enum(AssetType).describe('Asset type').meta({ id: 'AssetTypeEnum' });

export enum ChecksumAlgorithm {
  /** sha1 checksum of the whole file contents */
  sha1File = 'sha1',
  /** sha1 checksum of "path:" plus the file path, currently used in external libraries, deprecated */
  sha1Path = 'sha1-path',
}

export enum AssetFileType {
  /**
   * An full/large-size image extracted/converted from RAW photos
   */
  FullSize = 'fullsize',
  Preview = 'preview',
  Thumbnail = 'thumbnail',
  Sidecar = 'sidecar',
  EncodedVideo = 'encoded_video',
}

export enum AlbumUserRole {
  Editor = 'editor',
  Owner = 'owner',
  Viewer = 'viewer',
}

export const AlbumUserRoleSchema = z.enum(AlbumUserRole).describe('Album user role').meta({ id: 'AlbumUserRole' });

export enum AssetOrder {
  Asc = 'asc',
  Desc = 'desc',
}

export const AssetOrderSchema = z.enum(AssetOrder).describe('Asset sort order').meta({ id: 'AssetOrder' });

export enum MemoryType {
  /** pictures taken on this day X years ago */
  OnThisDay = 'on_this_day',
}

export const MemoryTypeSchema = z.enum(MemoryType).describe('Memory type').meta({ id: 'MemoryType' });

export enum AssetOrderWithRandom {
  // Include existing values
  Asc = AssetOrder.Asc,
  Desc = AssetOrder.Desc,
  /** Randomly Ordered */
  Random = 'random',
}

export const AssetOrderWithRandomSchema = z
  .enum(AssetOrderWithRandom)
  .describe('Sort order')
  .meta({ id: 'MemorySearchOrder' });

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
  AssetStatistics = 'asset.statistics',
  AssetShare = 'asset.share',
  AssetView = 'asset.view',
  AssetDownload = 'asset.download',
  AssetUpload = 'asset.upload',
  AssetCopy = 'asset.copy',
  AssetDerive = 'asset.derive',

  AssetEditGet = 'asset.edit.get',
  AssetEditCreate = 'asset.edit.create',
  AssetEditDelete = 'asset.edit.delete',

  AlbumCreate = 'album.create',
  AlbumRead = 'album.read',
  AlbumUpdate = 'album.update',
  AlbumDelete = 'album.delete',
  AlbumStatistics = 'album.statistics',
  AlbumShare = 'album.share',
  AlbumDownload = 'album.download',

  AlbumAssetCreate = 'albumAsset.create',
  AlbumAssetDelete = 'albumAsset.delete',

  AlbumUserCreate = 'albumUser.create',
  AlbumUserUpdate = 'albumUser.update',
  AlbumUserDelete = 'albumUser.delete',

  AuthChangePassword = 'auth.changePassword',

  AuthDeviceDelete = 'authDevice.delete',

  ArchiveRead = 'archive.read',

  BackupList = 'backup.list',
  BackupDownload = 'backup.download',
  BackupUpload = 'backup.upload',
  BackupDelete = 'backup.delete',

  DuplicateRead = 'duplicate.read',
  DuplicateDelete = 'duplicate.delete',

  FaceCreate = 'face.create',
  FaceRead = 'face.read',
  FaceUpdate = 'face.update',
  FaceDelete = 'face.delete',

  FolderRead = 'folder.read',

  JobCreate = 'job.create',
  JobRead = 'job.read',

  LibraryCreate = 'library.create',
  LibraryRead = 'library.read',
  LibraryUpdate = 'library.update',
  LibraryDelete = 'library.delete',
  LibraryStatistics = 'library.statistics',

  TimelineRead = 'timeline.read',
  TimelineDownload = 'timeline.download',

  Maintenance = 'maintenance',

  MapRead = 'map.read',
  MapSearch = 'map.search',

  MemoryCreate = 'memory.create',
  MemoryRead = 'memory.read',
  MemoryUpdate = 'memory.update',
  MemoryDelete = 'memory.delete',
  MemoryStatistics = 'memory.statistics',

  MemoryAssetCreate = 'memoryAsset.create',
  MemoryAssetDelete = 'memoryAsset.delete',

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

  PinCodeCreate = 'pinCode.create',
  PinCodeUpdate = 'pinCode.update',
  PinCodeDelete = 'pinCode.delete',

  PluginCreate = 'plugin.create',
  PluginRead = 'plugin.read',
  PluginUpdate = 'plugin.update',
  PluginDelete = 'plugin.delete',

  ServerAbout = 'server.about',
  ServerApkLinks = 'server.apkLinks',
  ServerStorage = 'server.storage',
  ServerStatistics = 'server.statistics',
  ServerVersionCheck = 'server.versionCheck',

  ServerLicenseRead = 'serverLicense.read',
  ServerLicenseUpdate = 'serverLicense.update',
  ServerLicenseDelete = 'serverLicense.delete',

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

  SyncStream = 'sync.stream',
  SyncCheckpointRead = 'syncCheckpoint.read',
  SyncCheckpointUpdate = 'syncCheckpoint.update',
  SyncCheckpointDelete = 'syncCheckpoint.delete',

  SystemConfigRead = 'systemConfig.read',
  SystemConfigUpdate = 'systemConfig.update',

  SystemMetadataRead = 'systemMetadata.read',
  SystemMetadataUpdate = 'systemMetadata.update',

  TagCreate = 'tag.create',
  TagRead = 'tag.read',
  TagUpdate = 'tag.update',
  TagDelete = 'tag.delete',
  TagAsset = 'tag.asset',

  UserRead = 'user.read',
  UserUpdate = 'user.update',

  UserLicenseCreate = 'userLicense.create',
  UserLicenseRead = 'userLicense.read',
  UserLicenseUpdate = 'userLicense.update',
  UserLicenseDelete = 'userLicense.delete',

  UserOnboardingRead = 'userOnboarding.read',
  UserOnboardingUpdate = 'userOnboarding.update',
  UserOnboardingDelete = 'userOnboarding.delete',

  UserPreferenceRead = 'userPreference.read',
  UserPreferenceUpdate = 'userPreference.update',

  UserProfileImageCreate = 'userProfileImage.create',
  UserProfileImageRead = 'userProfileImage.read',
  UserProfileImageUpdate = 'userProfileImage.update',
  UserProfileImageDelete = 'userProfileImage.delete',

  QueueRead = 'queue.read',
  QueueUpdate = 'queue.update',

  QueueJobCreate = 'queueJob.create',
  QueueJobRead = 'queueJob.read',
  QueueJobUpdate = 'queueJob.update',
  QueueJobDelete = 'queueJob.delete',

  WorkflowCreate = 'workflow.create',
  WorkflowRead = 'workflow.read',
  WorkflowUpdate = 'workflow.update',
  WorkflowDelete = 'workflow.delete',

  AdminUserCreate = 'adminUser.create',
  AdminUserRead = 'adminUser.read',
  AdminUserUpdate = 'adminUser.update',
  AdminUserDelete = 'adminUser.delete',

  AdminSessionRead = 'adminSession.read',

  AdminAuthUnlinkAll = 'adminAuth.unlinkAll',
}

export enum SharedLinkType {
  Album = 'ALBUM',

  /**
   * Individual asset
   * or group of assets that are not in an album
   */
  Individual = 'INDIVIDUAL',
}

export const SharedLinkTypeSchema = z.enum(SharedLinkType).describe('Shared link type').meta({ id: 'SharedLinkType' });

export enum StorageFolder {
  EncodedVideo = 'encoded-video',
  Library = 'library',
  Upload = 'upload',
  Profile = 'profile',
  Thumbnails = 'thumbs',
  Backups = 'backups',
}

export const StorageFolderSchema = z.enum(StorageFolder).describe('Storage folder').meta({ id: 'StorageFolder' });

export enum SystemMetadataKey {
  MediaLocation = 'MediaLocation',
  ReverseGeocodingState = 'reverse-geocoding-state',
  FacialRecognitionState = 'facial-recognition-state',
  MemoriesState = 'memories-state',
  AdminOnboarding = 'admin-onboarding',
  MaintenanceMode = 'maintenance-mode',
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

export const UserMetadataKeySchema = z
  .enum(UserMetadataKey)
  .describe('User metadata key')
  .meta({ id: 'UserMetadataKey' });

export enum AssetMetadataKey {
  MobileApp = 'mobile-app',
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

export const UserAvatarColorSchema = z
  .enum(UserAvatarColor)
  .describe('User avatar color')
  .meta({ id: 'UserAvatarColor' });

export enum UserStatus {
  Active = 'active',
  Removing = 'removing',
  Deleted = 'deleted',
}

export const UserStatusSchema = z.enum(UserStatus).describe('User status').meta({ id: 'UserStatus' });

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

export const SourceTypeSchema = z.enum(SourceType).describe('Face detection source type').meta({ id: 'SourceType' });

export enum ManualJobName {
  PersonCleanup = 'person-cleanup',
  TagCleanup = 'tag-cleanup',
  UserCleanup = 'user-cleanup',
  MemoryCleanup = 'memory-cleanup',
  MemoryCreate = 'memory-create',
  BackupDatabase = 'backup-database',
}

export const ManualJobNameSchema = z.enum(ManualJobName).describe('Manual job name').meta({ id: 'ManualJobName' });

export enum AssetPathType {
  Original = 'original',
  EncodedVideo = 'encoded_video',
}

export enum PersonPathType {
  Face = 'face',
}

export enum UserPathType {
  Profile = 'profile',
}

export type PathType = AssetFileType | AssetPathType | PersonPathType | UserPathType;

export enum TranscodePolicy {
  All = 'all',
  Optimal = 'optimal',
  Bitrate = 'bitrate',
  Required = 'required',
  Disabled = 'disabled',
}

export const TranscodePolicySchema = z
  .enum(TranscodePolicy)
  .describe('Transcode policy')
  .meta({ id: 'TranscodePolicy' });

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

export const VideoCodecSchema = z.enum(VideoCodec).describe('Target video codec').meta({ id: 'VideoCodec' });

export enum VideoSegmentCodec {
  Av1 = 'av1',
  Hevc = 'hevc',
  H264 = 'h264',
}

export enum AudioCodec {
  Mp3 = 'mp3',
  Aac = 'aac',
  Opus = 'opus',
  PcmS16le = 'pcm_s16le',
}

export const AudioCodecSchema = z.enum(AudioCodec).describe('Target audio codec').meta({ id: 'AudioCodec' });

export enum VideoContainer {
  Mov = 'mov',
  Mp4 = 'mp4',
  Ogg = 'ogg',
  Webm = 'webm',
}

export const VideoContainerSchema = z
  .enum(VideoContainer)
  .describe('Accepted video containers')
  .meta({ id: 'VideoContainer' });

export enum TranscodeHardwareAcceleration {
  Nvenc = 'nvenc',
  Qsv = 'qsv',
  Vaapi = 'vaapi',
  Rkmpp = 'rkmpp',
  Disabled = 'disabled',
}

export const TranscodeHardwareAccelerationSchema = z
  .enum(TranscodeHardwareAcceleration)
  .describe('Transcode hardware acceleration')
  .meta({ id: 'TranscodeHWAccel' });

export enum ToneMapping {
  Hable = 'hable',
  Mobius = 'mobius',
  Reinhard = 'reinhard',
  Disabled = 'disabled',
}

export const ToneMappingSchema = z.enum(ToneMapping).describe('Tone mapping').meta({ id: 'ToneMapping' });

export enum CQMode {
  Auto = 'auto',
  Cqp = 'cqp',
  Icq = 'icq',
}

export const CQModeSchema = z.enum(CQMode).describe('CQ mode').meta({ id: 'CQMode' });

export enum Colorspace {
  Srgb = 'srgb',
  P3 = 'p3',
}

export const ColorspaceSchema = z.enum(Colorspace).describe('Colorspace').meta({ id: 'Colorspace' });

export enum ImageFormat {
  Jpeg = 'jpeg',
  Webp = 'webp',
}

export const ImageFormatSchema = z.enum(ImageFormat).describe('Image format').meta({ id: 'ImageFormat' });

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

export const LogLevelSchema = z.enum(LogLevel).describe('Log level').meta({ id: 'LogLevel' });

export enum LogFormat {
  Console = 'console',
  Json = 'json',
}

export const LogFormatSchema = z.enum(LogFormat).describe('Log format').meta({ id: 'LogFormat' });

export enum ApiCustomExtension {
  Permission = 'x-immich-permission',
  AdminOnly = 'x-immich-admin-only',
  History = 'x-immich-history',
  State = 'x-immich-state',
}

export enum MetadataKey {
  AuthRoute = 'auth_route',
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

export const ImmichEnvironmentSchema = z
  .enum(ImmichEnvironment)
  .describe('Immich environment')
  .meta({ id: 'ImmichEnvironment' });

export enum ImmichWorker {
  Api = 'api',
  Maintenance = 'maintenance',
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

/** ITU-T H.273 colour primaries codes. */
export enum ColorPrimaries {
  Reserved = 0,
  Bt709 = 1,
  Unknown = 2,
  Bt470M = 4,
  Bt470Bg = 5,
  Smpte170M = 6,
  Smpte240M = 7,
  Film = 8,
  Bt2020 = 9,
  Smpte428 = 10,
  Smpte431 = 11,
  Smpte432 = 12,
  Ebu3213 = 22,
}

/** ITU-T H.273 transfer characteristics codes. */
export enum ColorTransfer {
  Reserved = 0,
  Bt709 = 1,
  Unknown = 2,
  Bt470M = 4,
  Bt470Bg = 5,
  Smpte170M = 6,
  Smpte240M = 7,
  Linear = 8,
  Log100 = 9,
  Log316 = 10,
  Iec6196624 = 11,
  Bt1361E = 12,
  Iec6196621 = 13,
  Bt202010 = 14,
  Bt202012 = 15,
  Smpte2084 = 16,
  Smpte428 = 17,
  AribStdB67 = 18,
}

/** ITU-T H.273 matrix coefficients codes. */
export enum ColorMatrix {
  Gbr = 0,
  Bt709 = 1,
  Unknown = 2,
  Reserved = 3,
  Fcc = 4,
  Bt470Bg = 5,
  Smpte170M = 6,
  Smpte240M = 7,
  Ycgco = 8,
  Bt2020Nc = 9,
  Bt2020C = 10,
  Smpte2085 = 11,
  ChromaDerivedNc = 12,
  ChromaDerivedC = 13,
  Ictcp = 14,
}

/** H.264 `profile_idc` values. */
// H.264 has a few profiles that have the same value but different names, included so lookup by name works
export enum H264Profile {
  ConstrainedBaseline = 66,
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  Baseline = 66,
  Main = 77,
  Extended = 88,
  ConstrainedHigh = 100,
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  ProgressiveHigh = 100,
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  High = 100,
  High10 = 110,
  High422 = 122,
  High444Predictive = 244,
}

/** HEVC `profile_idc` values. */
export enum HevcProfile {
  Main = 1,
  Main10 = 2,
  MainStillPicture = 3,
  Rext = 4,
}

/** AV1 `seq_profile` values. */
export enum Av1Profile {
  Main = 0,
  High = 1,
  Professional = 2,
}

/** MPEG-4 Audio Object Type values for AAC. */
export enum AacProfile {
  Main = 1,
  Lc = 2,
  Ssr = 3,
  Ltp = 4,
  HeAac = 5,
  Ld = 23,
  HeAacv2 = 29,
  Eld = 39,
  XheAac = 42,
}

/** Dolby Vision bitstream profile numbers from the DOVI configuration record. */
export enum DvProfile {
  Dvhe03 = 3,
  Dvhe04 = 4,
  Dvhe05 = 5,
  Dvhe07 = 7,
  Dvhe08 = 8,
  Dvav09 = 9,
  Dav110 = 10,
}

/**
 * Dolby Vision base-layer signal-compatibility ID from the DOVI configuration record.
 * Identifies what the base HEVC/AVC layer renders as on a non-DV decoder.
 */
export enum DvSignalCompatibility {
  None = 0,
  Hdr10 = 1,
  Sdr709 = 2,
  Hlg = 4,
  Sdr2020 = 6,
}

export enum DatabaseExtension {
  Cube = 'cube',
  EarthDistance = 'earthdistance',
  Vector = 'vector',
  VectorChord = 'vchord',
}

export enum BootstrapEventPriority {
  // Database service should be initialized before anything else, most other services need database access
  DatabaseService = -200,
  // Detect and configure the media location before jobs are queued which may use it
  StorageService = -195,
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
  Ocr = 'ocr',
  Workflow = 'workflow',
  Editor = 'editor',
}

export const QueueNameSchema = z.enum(QueueName).describe('Queue name').meta({ id: 'QueueName' });

export enum QueueJobStatus {
  Active = 'active',
  Failed = 'failed',
  Complete = 'completed',
  Delayed = 'delayed',
  Waiting = 'waiting',
  Paused = 'paused',
}

export const QueueJobStatusSchema = z.enum(QueueJobStatus).describe('Queue job status').meta({ id: 'QueueJobStatus' });

export enum JobName {
  AssetDelete = 'AssetDelete',
  AssetDeleteCheck = 'AssetDeleteCheck',
  AssetDetectFacesQueueAll = 'AssetDetectFacesQueueAll',
  AssetDetectFaces = 'AssetDetectFaces',
  AssetDetectDuplicatesQueueAll = 'AssetDetectDuplicatesQueueAll',
  AssetDetectDuplicates = 'AssetDetectDuplicates',
  AssetEditThumbnailGeneration = 'AssetEditThumbnailGeneration',
  AssetEncodeVideoQueueAll = 'AssetEncodeVideoQueueAll',
  AssetEncodeVideo = 'AssetEncodeVideo',
  AssetEmptyTrash = 'AssetEmptyTrash',
  AssetExtractMetadataQueueAll = 'AssetExtractMetadataQueueAll',
  AssetExtractMetadata = 'AssetExtractMetadata',
  AssetFileMigration = 'AssetFileMigration',
  AssetGenerateThumbnailsQueueAll = 'AssetGenerateThumbnailsQueueAll',
  AssetGenerateThumbnails = 'AssetGenerateThumbnails',

  AuditTableCleanup = 'AuditTableCleanup',

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
  SidecarCheck = 'SidecarCheck',
  SidecarWrite = 'SidecarWrite',

  SmartSearchQueueAll = 'SmartSearchQueueAll',
  SmartSearch = 'SmartSearch',

  StorageTemplateMigration = 'StorageTemplateMigration',
  StorageTemplateMigrationSingle = 'StorageTemplateMigrationSingle',

  TagCleanup = 'TagCleanup',

  VersionCheck = 'VersionCheck',

  // OCR
  OcrQueueAll = 'OcrQueueAll',
  Ocr = 'Ocr',

  // Workflow
  WorkflowRun = 'WorkflowRun',
}

export const JobNameSchema = z.enum(JobName).describe('Job name').meta({ id: 'JobName' });

export enum QueueCommand {
  Start = 'start',
  /** @deprecated Use `updateQueue` instead */
  Pause = 'pause',
  /** @deprecated Use `updateQueue` instead */
  Resume = 'resume',
  /** @deprecated Use `emptyQueue` instead */
  Empty = 'empty',
  /** @deprecated Use `emptyQueue` instead */
  ClearFailed = 'clear-failed',
}

export const QueueCommandSchema = z
  .enum(QueueCommand)
  .describe('Queue command to execute')
  .meta({ id: 'QueueCommand' });

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
  MediaLocation = 700,
  GetSystemConfig = 69,
  BackupDatabase = 42,
  MaintenanceOperation = 621,
  MemoryCreation = 777,
  VersionCheck = 800,
}

export enum MaintenanceAction {
  Start = 'start',
  End = 'end',
  SelectDatabaseRestore = 'select_database_restore',
  RestoreDatabase = 'restore_database',
}

export const MaintenanceActionSchema = z
  .enum(MaintenanceAction)
  .describe('Maintenance action')
  .meta({ id: 'MaintenanceAction' });

export enum ExitCode {
  AppRestart = 7,
}

export enum SyncRequestType {
  AlbumsV1 = 'AlbumsV1',
  AlbumsV2 = 'AlbumsV2',
  AlbumUsersV1 = 'AlbumUsersV1',
  AlbumToAssetsV1 = 'AlbumToAssetsV1',
  /** @deprecated */
  AlbumAssetsV1 = 'AlbumAssetsV1',
  AlbumAssetsV2 = 'AlbumAssetsV2',
  AlbumAssetExifsV1 = 'AlbumAssetExifsV1',
  /** @deprecated */
  AssetsV1 = 'AssetsV1',
  AssetsV2 = 'AssetsV2',
  AssetExifsV1 = 'AssetExifsV1',
  AssetEditsV1 = 'AssetEditsV1',
  AssetMetadataV1 = 'AssetMetadataV1',
  AuthUsersV1 = 'AuthUsersV1',
  MemoriesV1 = 'MemoriesV1',
  MemoryToAssetsV1 = 'MemoryToAssetsV1',
  PartnersV1 = 'PartnersV1',
  /** @deprecated */
  PartnerAssetsV1 = 'PartnerAssetsV1',
  PartnerAssetsV2 = 'PartnerAssetsV2',
  PartnerAssetExifsV1 = 'PartnerAssetExifsV1',
  PartnerStacksV1 = 'PartnerStacksV1',
  StacksV1 = 'StacksV1',
  UsersV1 = 'UsersV1',
  PeopleV1 = 'PeopleV1',
  /** @deprecated */
  AssetFacesV1 = 'AssetFacesV1',
  AssetFacesV2 = 'AssetFacesV2',
  UserMetadataV1 = 'UserMetadataV1',
}

export const SyncRequestTypeSchema = z
  .enum(SyncRequestType)
  .describe('Sync request type')
  .meta({ id: 'SyncRequestType' });

export enum SyncEntityType {
  AuthUserV1 = 'AuthUserV1',

  UserV1 = 'UserV1',
  UserDeleteV1 = 'UserDeleteV1',

  /** @deprecated */
  AssetV1 = 'AssetV1',
  AssetV2 = 'AssetV2',
  AssetDeleteV1 = 'AssetDeleteV1',
  AssetExifV1 = 'AssetExifV1',
  AssetEditV1 = 'AssetEditV1',
  AssetEditDeleteV1 = 'AssetEditDeleteV1',
  AssetMetadataV1 = 'AssetMetadataV1',
  AssetMetadataDeleteV1 = 'AssetMetadataDeleteV1',

  PartnerV1 = 'PartnerV1',
  PartnerDeleteV1 = 'PartnerDeleteV1',

  /** @deprecated */
  PartnerAssetV1 = 'PartnerAssetV1',
  PartnerAssetV2 = 'PartnerAssetV2',
  /** @deprecated */
  PartnerAssetBackfillV1 = 'PartnerAssetBackfillV1',
  PartnerAssetBackfillV2 = 'PartnerAssetBackfillV2',
  PartnerAssetDeleteV1 = 'PartnerAssetDeleteV1',
  PartnerAssetExifV1 = 'PartnerAssetExifV1',
  PartnerAssetExifBackfillV1 = 'PartnerAssetExifBackfillV1',
  PartnerStackBackfillV1 = 'PartnerStackBackfillV1',
  PartnerStackDeleteV1 = 'PartnerStackDeleteV1',
  PartnerStackV1 = 'PartnerStackV1',

  AlbumV1 = 'AlbumV1',
  AlbumV2 = 'AlbumV2',
  AlbumDeleteV1 = 'AlbumDeleteV1',

  AlbumUserV1 = 'AlbumUserV1',
  AlbumUserBackfillV1 = 'AlbumUserBackfillV1',
  AlbumUserDeleteV1 = 'AlbumUserDeleteV1',

  /** @deprecated */
  AlbumAssetCreateV1 = 'AlbumAssetCreateV1',
  AlbumAssetCreateV2 = 'AlbumAssetCreateV2',
  /** @deprecated */
  AlbumAssetUpdateV1 = 'AlbumAssetUpdateV1',
  AlbumAssetUpdateV2 = 'AlbumAssetUpdateV2',
  /** @deprecated */
  AlbumAssetBackfillV1 = 'AlbumAssetBackfillV1',
  AlbumAssetBackfillV2 = 'AlbumAssetBackfillV2',
  AlbumAssetExifCreateV1 = 'AlbumAssetExifCreateV1',
  AlbumAssetExifUpdateV1 = 'AlbumAssetExifUpdateV1',
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

  AssetFaceV1 = 'AssetFaceV1',
  AssetFaceV2 = 'AssetFaceV2',
  AssetFaceDeleteV1 = 'AssetFaceDeleteV1',

  UserMetadataV1 = 'UserMetadataV1',
  UserMetadataDeleteV1 = 'UserMetadataDeleteV1',

  SyncAckV1 = 'SyncAckV1',
  SyncResetV1 = 'SyncResetV1',
  SyncCompleteV1 = 'SyncCompleteV1',
}

export const SyncEntityTypeSchema = z.enum(SyncEntityType).describe('Sync entity type').meta({ id: 'SyncEntityType' });

export enum NotificationLevel {
  Success = 'success',
  Error = 'error',
  Warning = 'warning',
  Info = 'info',
}

export const NotificationLevelSchema = z
  .enum(NotificationLevel)
  .describe('Notification level')
  .meta({ id: 'NotificationLevel' });

export enum NotificationType {
  JobFailed = 'JobFailed',
  BackupFailed = 'BackupFailed',
  SystemMessage = 'SystemMessage',
  AlbumInvite = 'AlbumInvite',
  AlbumUpdate = 'AlbumUpdate',
  Custom = 'Custom',
}

export const NotificationTypeSchema = z
  .enum(NotificationType)
  .describe('Notification type')
  .meta({ id: 'NotificationType' });

export enum OAuthTokenEndpointAuthMethod {
  ClientSecretPost = 'client_secret_post',
  ClientSecretBasic = 'client_secret_basic',
}

export const OAuthTokenEndpointAuthMethodSchema = z
  .enum(OAuthTokenEndpointAuthMethod)
  .describe('OAuth token endpoint auth method')
  .meta({ id: 'OAuthTokenEndpointAuthMethod' });

export enum AssetVisibility {
  Archive = 'archive',
  Timeline = 'timeline',

  /**
   * Video part of the LivePhotos and MotionPhotos
   */
  Hidden = 'hidden',
  Locked = 'locked',
}

export const AssetVisibilitySchema = z
  .enum(AssetVisibility)
  .describe('Asset visibility')
  .meta({ id: 'AssetVisibility' });

export enum CronJob {
  LibraryScan = 'LibraryScan',
  NightlyJobs = 'NightlyJobs',
  VersionCheck = 'VersionCheck',
}

export enum ApiTag {
  Activities = 'Activities',
  Albums = 'Albums',
  ApiKeys = 'API keys',
  Authentication = 'Authentication',
  AuthenticationAdmin = 'Authentication (admin)',
  Assets = 'Assets',
  DatabaseBackups = 'Database Backups (admin)',
  Deprecated = 'Deprecated',
  Download = 'Download',
  Duplicates = 'Duplicates',
  Faces = 'Faces',
  Jobs = 'Jobs',
  Libraries = 'Libraries',
  Maintenance = 'Maintenance (admin)',
  Map = 'Map',
  Memories = 'Memories',
  Notifications = 'Notifications',
  NotificationsAdmin = 'Notifications (admin)',
  Partners = 'Partners',
  People = 'People',
  Plugins = 'Plugins',
  Queues = 'Queues',
  Search = 'Search',
  Server = 'Server',
  Sessions = 'Sessions',
  SharedLinks = 'Shared links',
  Stacks = 'Stacks',
  Sync = 'Sync',
  SystemConfig = 'System config',
  SystemMetadata = 'System metadata',
  Tags = 'Tags',
  Timeline = 'Timeline',
  Trash = 'Trash',
  UsersAdmin = 'Users (admin)',
  Users = 'Users',
  Views = 'Views',
  Workflows = 'Workflows',
}

export enum PluginContext {
  Asset = 'asset',
  Album = 'album',
  Person = 'person',
}

export const PluginContextSchema = z.enum(PluginContext).describe('Plugin context').meta({ id: 'PluginContextType' });

export enum PluginTriggerType {
  AssetCreate = 'AssetCreate',
  PersonRecognized = 'PersonRecognized',
}

export const PluginTriggerTypeSchema = z
  .enum(PluginTriggerType)
  .describe('Plugin trigger type')
  .meta({ id: 'PluginTriggerType' });
