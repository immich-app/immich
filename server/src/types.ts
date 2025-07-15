import { SystemConfig } from 'src/config';
import { VECTOR_EXTENSIONS } from 'src/constants';
import {
  AssetOrder,
  AssetType,
  DatabaseSslMode,
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
  bitrate: number;
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
  | QueueName.StorageTemplateMigration
  | QueueName.FacialRecognition
  | QueueName.DuplicateDetection
  | QueueName.BackupDatabase
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

export type JobSource = 'upload' | 'sidecar-write' | 'copy';
export interface IEntityJob extends IBaseJob {
  id: string;
  source?: JobSource;
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
  recipientId: string;
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
  | { name: JobName.BackupDatabase; data?: IBaseJob }

  // Transcoding
  | { name: JobName.QueueVideoConversion; data: IBaseJob }
  | { name: JobName.VideoConversation; data: IEntityJob }

  // Thumbnails
  | { name: JobName.QueueGenerateThumbnails; data: IBaseJob }
  | { name: JobName.GenerateThumbnails; data: IEntityJob }

  // User
  | { name: JobName.UserDeleteCheck; data?: IBaseJob }
  | { name: JobName.UserDeletion; data: IEntityJob }
  | { name: JobName.userSyncUsage; data?: IBaseJob }

  // Storage Template
  | { name: JobName.StorageTemplateMigration; data?: IBaseJob }
  | { name: JobName.StorageTemplateMigrationSingle; data: IEntityJob }

  // Migration
  | { name: JobName.QueueMigration; data?: IBaseJob }
  | { name: JobName.MigrateAsset; data: IEntityJob }
  | { name: JobName.MigratePerson; data: IEntityJob }

  // Metadata Extraction
  | { name: JobName.QueueMetadataExtraction; data: IBaseJob }
  | { name: JobName.MetadataExtraction; data: IEntityJob }

  // Notifications
  | { name: JobName.NotificationsCleanup; data?: IBaseJob }

  // Sidecar Scanning
  | { name: JobName.QueueSidecar; data: IBaseJob }
  | { name: JobName.SidecarDiscovery; data: IEntityJob }
  | { name: JobName.SidecarSync; data: IEntityJob }
  | { name: JobName.SidecarWrite; data: ISidecarWriteJob }

  // Facial Recognition
  | { name: JobName.QueueFaceDetection; data: IBaseJob }
  | { name: JobName.FaceDetection; data: IEntityJob }
  | { name: JobName.QueueFacialRecognition; data: INightlyJob }
  | { name: JobName.FacialRecognition; data: IDeferrableJob }
  | { name: JobName.GeneratePersonThumbnail; data: IEntityJob }

  // Smart Search
  | { name: JobName.QueueSmartSearch; data: IBaseJob }
  | { name: JobName.SmartSearch; data: IEntityJob }
  | { name: JobName.QueueTrashEmpty; data?: IBaseJob }

  // Duplicate Detection
  | { name: JobName.QueueDuplicateDetection; data: IBaseJob }
  | { name: JobName.DuplicateDetection; data: IEntityJob }

  // Memories
  | { name: JobName.MemoriesCleanup; data?: IBaseJob }
  | { name: JobName.MemoriesCreate; data?: IBaseJob }

  // Filesystem
  | { name: JobName.DeleteFiles; data: IDeleteFilesJob }

  // Cleanup
  | { name: JobName.CleanOldAuditLogs; data?: IBaseJob }
  | { name: JobName.CleanOldSessionTokens; data?: IBaseJob }

  // Tags
  | { name: JobName.TagCleanup; data?: IBaseJob }

  // Asset Deletion
  | { name: JobName.PersonCleanup; data?: IBaseJob }
  | { name: JobName.AssetDeletion; data: IAssetDeleteJob }
  | { name: JobName.AssetDeletionCheck; data?: IBaseJob }

  // Library Management
  | { name: JobName.LibrarySyncFiles; data: ILibraryFileJob }
  | { name: JobName.LibraryQueueSyncFiles; data: IEntityJob }
  | { name: JobName.LibraryQueueSyncAssets; data: IEntityJob }
  | { name: JobName.LibrarySyncAssets; data: ILibraryBulkIdsJob }
  | { name: JobName.LibraryAssetRemoval; data: ILibraryFileJob }
  | { name: JobName.LibraryDelete; data: IEntityJob }
  | { name: JobName.LibraryQueueScanAll; data?: IBaseJob }
  | { name: JobName.LibraryQueueCleanup; data: IBaseJob }

  // Notification
  | { name: JobName.SendMail; data: IEmailJob }
  | { name: JobName.NotifyAlbumInvite; data: INotifyAlbumInviteJob }
  | { name: JobName.NotifyAlbumUpdate; data: INotifyAlbumUpdateJob }
  | { name: JobName.NotifySignup; data: INotifySignupJob }

  // Version check
  | { name: JobName.VersionCheck; data: IBaseJob };

export type VectorExtension = (typeof VECTOR_EXTENSIONS)[number];

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
  ssl?: DatabaseSslMode;
};

export type DatabaseConnectionParams = DatabaseConnectionURL | DatabaseConnectionParts;

export interface ExtensionVersion {
  name: VectorExtension;
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
  extraId?: string;
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
  [MemoryType.OnThisDay]: OnThisDayData;
}

export type VersionCheckMetadata = { checkedAt: string; releaseVersion: string };
export type SystemFlags = { mountChecks: Record<StorageFolder, boolean> };
export type MemoriesState = {
  /** memories have already been created through this date */
  lastOnThisDayDate: string;
};

export interface SystemMetadata extends Record<SystemMetadataKey, Record<string, any>> {
  [SystemMetadataKey.AdminOnboarding]: { isOnboarded: boolean };
  [SystemMetadataKey.FacialRecognitionState]: { lastRun?: string };
  [SystemMetadataKey.License]: { licenseKey: string; activationKey: string; activatedAt: Date };
  [SystemMetadataKey.ReverseGeocodingState]: { lastUpdate?: string; lastImportFileName?: string };
  [SystemMetadataKey.SystemConfig]: DeepPartial<SystemConfig>;
  [SystemMetadataKey.SystemFlags]: DeepPartial<SystemFlags>;
  [SystemMetadataKey.VersionCheckState]: VersionCheckMetadata;
  [SystemMetadataKey.MemoriesState]: MemoriesState;
}

export type UserMetadataItem<T extends keyof UserMetadata = UserMetadataKey> = {
  key: T;
  value: UserMetadata[T];
};

export interface UserPreferences {
  albums: {
    defaultAssetOrder: AssetOrder;
  };
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
  cast: {
    gCastEnabled: boolean;
  };
}

export interface UserMetadata extends Record<UserMetadataKey, Record<string, any>> {
  [UserMetadataKey.Preferences]: DeepPartial<UserPreferences>;
  [UserMetadataKey.License]: { licenseKey: string; activationKey: string; activatedAt: string };
  [UserMetadataKey.Onboarding]: { isOnboarded: boolean };
}
