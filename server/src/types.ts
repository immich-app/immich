import { SystemConfig } from 'src/config';
import {
  AssetType,
  DatabaseExtension,
  ExifOrientation,
  ImageFormat,
  JobName,
  MemoryType,
  QueueName,
  StorageFolder,
  SyncEntityType,
  SystemMetadataKey,
  TranscodeTarget,
  UserMetadataKey,
  VideoCodec,
} from 'src/enum';

export type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;

export type RepositoryInterface<T extends object> = Pick<T, keyof T>;

export interface CropOptions {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface FullsizeImageOptions {
  format: ImageFormat;
  quality: number;
  enabled: boolean;
}

export interface ImageOptions {
  format: ImageFormat;
  quality: number;
  size: number;
}

export interface RawImageInfo {
  width: number;
  height: number;
  channels: 1 | 2 | 3 | 4;
}

interface DecodeImageOptions {
  colorspace: string;
  crop?: CropOptions;
  processInvalidImages: boolean;
  raw?: RawImageInfo;
}

export interface DecodeToBufferOptions extends DecodeImageOptions {
  size?: number;
  orientation?: ExifOrientation;
}

export type GenerateThumbnailOptions = Pick<ImageOptions, 'format' | 'quality'> & DecodeToBufferOptions;

export type GenerateThumbnailFromBufferOptions = GenerateThumbnailOptions & { raw: RawImageInfo };

export type GenerateThumbhashOptions = DecodeImageOptions;

export type GenerateThumbhashFromBufferOptions = GenerateThumbhashOptions & { raw: RawImageInfo };

export interface GenerateThumbnailsOptions {
  colorspace: string;
  crop?: CropOptions;
  preview?: ImageOptions;
  processInvalidImages: boolean;
  thumbhash?: boolean;
  thumbnail?: ImageOptions;
}

export interface VideoStreamInfo {
  index: number;
  height: number;
  width: number;
  rotation: number;
  codecName?: string;
  frameCount: number;
  isHDR: boolean;
  bitrate: number;
  pixelFormat: string;
}

export interface AudioStreamInfo {
  index: number;
  codecName?: string;
  frameCount: number;
}

export interface VideoFormat {
  formatName?: string;
  formatLongName?: string;
  duration: number;
  bitrate: number;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface InputDimensions extends ImageDimensions {
  inputPath: string;
}

export interface VideoInfo {
  format: VideoFormat;
  videoStreams: VideoStreamInfo[];
  audioStreams: AudioStreamInfo[];
}

export interface TranscodeCommand {
  inputOptions: string[];
  outputOptions: string[];
  twoPass: boolean;
  progress: {
    frameCount: number;
    percentInterval: number;
  };
}

export interface BitrateDistribution {
  max: number;
  target: number;
  min: number;
  unit: string;
}

export interface ImageBuffer {
  data: Buffer;
  info: RawImageInfo;
}

export interface VideoCodecSWConfig {
  getCommand(
    target: TranscodeTarget,
    videoStream: VideoStreamInfo,
    audioStream: AudioStreamInfo,
    format?: VideoFormat,
  ): TranscodeCommand;
}

export interface VideoCodecHWConfig extends VideoCodecSWConfig {
  getSupportedCodecs(): Array<VideoCodec>;
}

export interface ProbeOptions {
  countFrames: boolean;
}

export interface VideoInterfaces {
  dri: string[];
  mali: boolean;
}

export type ConcurrentQueueName = Exclude<
  QueueName,
  | QueueName.STORAGE_TEMPLATE_MIGRATION
  | QueueName.FACIAL_RECOGNITION
  | QueueName.DUPLICATE_DETECTION
  | QueueName.BACKUP_DATABASE
>;

export type Jobs = { [K in JobItem['name']]: (JobItem & { name: K })['data'] };
export type JobOf<T extends JobName> = Jobs[T];

export interface IBaseJob {
  force?: boolean;
}

export interface IDelayedJob extends IBaseJob {
  /** The minimum time to wait to execute this job, in milliseconds. */
  delay?: number;
}

export interface IEntityJob extends IBaseJob {
  id: string;
  source?: 'upload' | 'sidecar-write' | 'copy';
  notify?: boolean;
}

export interface IAssetDeleteJob extends IEntityJob {
  deleteOnDisk: boolean;
}

export interface ILibraryFileJob {
  libraryId: string;
  paths: string[];
  progressCounter?: number;
  totalAssets?: number;
}

export interface ILibraryBulkIdsJob {
  libraryId: string;
  importPaths: string[];
  exclusionPatterns: string[];
  assetIds: string[];
  progressCounter: number;
  totalAssets: number;
}

export interface IBulkEntityJob {
  ids: string[];
}

export interface IDeleteFilesJob extends IBaseJob {
  files: Array<string | null | undefined>;
}

export interface ISidecarWriteJob extends IEntityJob {
  description?: string;
  dateTimeOriginal?: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  tags?: true;
}

export interface IDeferrableJob extends IEntityJob {
  deferred?: boolean;
}

export interface INightlyJob extends IBaseJob {
  nightly?: boolean;
}

export type EmailImageAttachment = {
  filename: string;
  path: string;
  cid: string;
};

export interface IEmailJob {
  to: string;
  subject: string;
  html: string;
  text: string;
  imageAttachments?: EmailImageAttachment[];
}

export interface INotifySignupJob extends IEntityJob {
  tempPassword?: string;
}

export interface INotifyAlbumInviteJob extends IEntityJob {
  recipientId: string;
}

export interface INotifyAlbumUpdateJob extends IEntityJob, IDelayedJob {
  recipientIds: string[];
}

export interface JobCounts {
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  waiting: number;
  paused: number;
}

export interface QueueStatus {
  isActive: boolean;
  isPaused: boolean;
}

export type JobItem =
  // Backups
  | { name: JobName.BACKUP_DATABASE; data?: IBaseJob }

  // Transcoding
  | { name: JobName.QUEUE_VIDEO_CONVERSION; data: IBaseJob }
  | { name: JobName.VIDEO_CONVERSION; data: IEntityJob }

  // Thumbnails
  | { name: JobName.QUEUE_GENERATE_THUMBNAILS; data: IBaseJob }
  | { name: JobName.GENERATE_THUMBNAILS; data: IEntityJob }

  // User
  | { name: JobName.USER_DELETE_CHECK; data?: IBaseJob }
  | { name: JobName.USER_DELETION; data: IEntityJob }
  | { name: JobName.USER_SYNC_USAGE; data?: IBaseJob }

  // Storage Template
  | { name: JobName.STORAGE_TEMPLATE_MIGRATION; data?: IBaseJob }
  | { name: JobName.STORAGE_TEMPLATE_MIGRATION_SINGLE; data: IEntityJob }

  // Migration
  | { name: JobName.QUEUE_MIGRATION; data?: IBaseJob }
  | { name: JobName.MIGRATE_ASSET; data: IEntityJob }
  | { name: JobName.MIGRATE_PERSON; data: IEntityJob }

  // Metadata Extraction
  | { name: JobName.QUEUE_METADATA_EXTRACTION; data: IBaseJob }
  | { name: JobName.METADATA_EXTRACTION; data: IEntityJob }

  // Notifications
  | { name: JobName.NOTIFICATIONS_CLEANUP; data?: IBaseJob }

  // Sidecar Scanning
  | { name: JobName.QUEUE_SIDECAR; data: IBaseJob }
  | { name: JobName.SIDECAR_DISCOVERY; data: IEntityJob }
  | { name: JobName.SIDECAR_SYNC; data: IEntityJob }
  | { name: JobName.SIDECAR_WRITE; data: ISidecarWriteJob }

  // Facial Recognition
  | { name: JobName.QUEUE_FACE_DETECTION; data: IBaseJob }
  | { name: JobName.FACE_DETECTION; data: IEntityJob }
  | { name: JobName.QUEUE_FACIAL_RECOGNITION; data: INightlyJob }
  | { name: JobName.FACIAL_RECOGNITION; data: IDeferrableJob }
  | { name: JobName.GENERATE_PERSON_THUMBNAIL; data: IEntityJob }

  // Smart Search
  | { name: JobName.QUEUE_SMART_SEARCH; data: IBaseJob }
  | { name: JobName.SMART_SEARCH; data: IEntityJob }
  | { name: JobName.QUEUE_TRASH_EMPTY; data?: IBaseJob }

  // Duplicate Detection
  | { name: JobName.QUEUE_DUPLICATE_DETECTION; data: IBaseJob }
  | { name: JobName.DUPLICATE_DETECTION; data: IEntityJob }

  // Memories
  | { name: JobName.MEMORIES_CLEANUP; data?: IBaseJob }
  | { name: JobName.MEMORIES_CREATE; data?: IBaseJob }

  // Filesystem
  | { name: JobName.DELETE_FILES; data: IDeleteFilesJob }

  // Cleanup
  | { name: JobName.CLEAN_OLD_AUDIT_LOGS; data?: IBaseJob }
  | { name: JobName.CLEAN_OLD_SESSION_TOKENS; data?: IBaseJob }

  // Tags
  | { name: JobName.TAG_CLEANUP; data?: IBaseJob }

  // Asset Deletion
  | { name: JobName.PERSON_CLEANUP; data?: IBaseJob }
  | { name: JobName.ASSET_DELETION; data: IAssetDeleteJob }
  | { name: JobName.ASSET_DELETION_CHECK; data?: IBaseJob }

  // Library Management
  | { name: JobName.LIBRARY_SYNC_FILES; data: ILibraryFileJob }
  | { name: JobName.LIBRARY_QUEUE_SYNC_FILES; data: IEntityJob }
  | { name: JobName.LIBRARY_QUEUE_SYNC_ASSETS; data: IEntityJob }
  | { name: JobName.LIBRARY_SYNC_ASSETS; data: ILibraryBulkIdsJob }
  | { name: JobName.LIBRARY_ASSET_REMOVAL; data: ILibraryFileJob }
  | { name: JobName.LIBRARY_DELETE; data: IEntityJob }
  | { name: JobName.LIBRARY_QUEUE_SCAN_ALL; data?: IBaseJob }
  | { name: JobName.LIBRARY_QUEUE_CLEANUP; data: IBaseJob }

  // Notification
  | { name: JobName.SEND_EMAIL; data: IEmailJob }
  | { name: JobName.NOTIFY_ALBUM_INVITE; data: INotifyAlbumInviteJob }
  | { name: JobName.NOTIFY_ALBUM_UPDATE; data: INotifyAlbumUpdateJob }
  | { name: JobName.NOTIFY_SIGNUP; data: INotifySignupJob }

  // Version check
  | { name: JobName.VERSION_CHECK; data: IBaseJob }

  // Memories
  | { name: JobName.MEMORIES_CLEANUP; data?: IBaseJob }
  | { name: JobName.MEMORIES_CREATE; data?: IBaseJob };

export type VectorExtension = DatabaseExtension.VECTOR | DatabaseExtension.VECTORS;

export type DatabaseConnectionURL = {
  connectionType: 'url';
  url: string;
};

export type DatabaseConnectionParts = {
  connectionType: 'parts';
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
};

export type DatabaseConnectionParams = DatabaseConnectionURL | DatabaseConnectionParts;

export interface ExtensionVersion {
  availableVersion: string | null;
  installedVersion: string | null;
}

export interface VectorUpdateResult {
  restartRequired: boolean;
}

export interface ImmichFile extends Express.Multer.File {
  /** sha1 hash of file */
  uuid: string;
  checksum: Buffer;
}

export interface UploadFile {
  uuid: string;
  checksum: Buffer;
  originalPath: string;
  originalName: string;
  size: number;
}

export interface UploadFiles {
  assetData: ImmichFile[];
  sidecarData: ImmichFile[];
}

export interface IBulkAsset {
  getAssetIds: (id: string, assetIds: string[]) => Promise<Set<string>>;
  addAssetIds: (id: string, assetIds: string[]) => Promise<void>;
  removeAssetIds: (id: string, assetIds: string[]) => Promise<void>;
}

export type SyncAck = {
  type: SyncEntityType;
  updateId: string;
};

export type StorageAsset = {
  id: string;
  ownerId: string;
  livePhotoVideoId: string | null;
  type: AssetType;
  isExternal: boolean;
  checksum: Buffer;
  timeZone: string | null;
  fileCreatedAt: Date;
  originalPath: string;
  originalFileName: string;
  sidecarPath: string | null;
  fileSizeInByte: number | null;
};

export type OnThisDayData = { year: number };

export interface MemoryData {
  [MemoryType.ON_THIS_DAY]: OnThisDayData;
}

export type VersionCheckMetadata = { checkedAt: string; releaseVersion: string };
export type SystemFlags = { mountChecks: Record<StorageFolder, boolean> };
export type MemoriesState = {
  /** memories have already been created through this date */
  lastOnThisDayDate: string;
};

export interface SystemMetadata extends Record<SystemMetadataKey, Record<string, any>> {
  [SystemMetadataKey.ADMIN_ONBOARDING]: { isOnboarded: boolean };
  [SystemMetadataKey.FACIAL_RECOGNITION_STATE]: { lastRun?: string };
  [SystemMetadataKey.LICENSE]: { licenseKey: string; activationKey: string; activatedAt: Date };
  [SystemMetadataKey.REVERSE_GEOCODING_STATE]: { lastUpdate?: string; lastImportFileName?: string };
  [SystemMetadataKey.SYSTEM_CONFIG]: DeepPartial<SystemConfig>;
  [SystemMetadataKey.SYSTEM_FLAGS]: DeepPartial<SystemFlags>;
  [SystemMetadataKey.VERSION_CHECK_STATE]: VersionCheckMetadata;
  [SystemMetadataKey.MEMORIES_STATE]: MemoriesState;
}

export type UserMetadataItem<T extends keyof UserMetadata = UserMetadataKey> = {
  key: T;
  value: UserMetadata[T];
};

export interface UserPreferences {
  folders: {
    enabled: boolean;
    sidebarWeb: boolean;
  };
  memories: {
    enabled: boolean;
  };
  people: {
    enabled: boolean;
    sidebarWeb: boolean;
  };
  ratings: {
    enabled: boolean;
  };
  sharedLinks: {
    enabled: boolean;
    sidebarWeb: boolean;
  };
  tags: {
    enabled: boolean;
    sidebarWeb: boolean;
  };
  emailNotifications: {
    enabled: boolean;
    albumInvite: boolean;
    albumUpdate: boolean;
  };
  download: {
    archiveSize: number;
    includeEmbeddedVideos: boolean;
  };
  purchase: {
    showSupportBadge: boolean;
    hideBuyButtonUntil: string;
  };
}

export interface UserMetadata extends Record<UserMetadataKey, Record<string, any>> {
  [UserMetadataKey.PREFERENCES]: DeepPartial<UserPreferences>;
  [UserMetadataKey.LICENSE]: { licenseKey: string; activationKey: string; activatedAt: string };
}
