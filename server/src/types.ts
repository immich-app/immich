import { SystemConfig } from 'src/config';
import { VECTOR_EXTENSIONS } from 'src/constants';
import { UploadFieldName } from 'src/dtos/asset-media.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  AssetMetadataKey,
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
  password?: string;
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
  // Audit
  | { name: JobName.AuditTableCleanup; data?: IBaseJob }

  // Backups
  | { name: JobName.DatabaseBackup; data?: IBaseJob }

  // Transcoding
  | { name: JobName.AssetEncodeVideoQueueAll; data: IBaseJob }
  | { name: JobName.AssetEncodeVideo; data: IEntityJob }

  // Thumbnails
  | { name: JobName.AssetGenerateThumbnailsQueueAll; data: IBaseJob }
  | { name: JobName.AssetGenerateThumbnails; data: IEntityJob }

  // User
  | { name: JobName.UserDeleteCheck; data?: IBaseJob }
  | { name: JobName.UserDelete; data: IEntityJob }
  | { name: JobName.UserSyncUsage; data?: IBaseJob }

  // Storage Template
  | { name: JobName.StorageTemplateMigration; data?: IBaseJob }
  | { name: JobName.StorageTemplateMigrationSingle; data: IEntityJob }

  // Migration
  | { name: JobName.FileMigrationQueueAll; data?: IBaseJob }
  | { name: JobName.AssetFileMigration; data: IEntityJob }
  | { name: JobName.PersonFileMigration; data: IEntityJob }

  // Metadata Extraction
  | { name: JobName.AssetExtractMetadataQueueAll; data: IBaseJob }
  | { name: JobName.AssetExtractMetadata; data: IEntityJob }

  // Notifications
  | { name: JobName.NotificationsCleanup; data?: IBaseJob }

  // Sidecar Scanning
  | { name: JobName.SidecarQueueAll; data: IBaseJob }
  | { name: JobName.SidecarCheck; data: IEntityJob }
  | { name: JobName.SidecarWrite; data: ISidecarWriteJob }

  // Facial Recognition
  | { name: JobName.AssetDetectFacesQueueAll; data: IBaseJob }
  | { name: JobName.AssetDetectFaces; data: IEntityJob }
  | { name: JobName.FacialRecognitionQueueAll; data: INightlyJob }
  | { name: JobName.FacialRecognition; data: IDeferrableJob }
  | { name: JobName.PersonGenerateThumbnail; data: IEntityJob }

  // Smart Search
  | { name: JobName.SmartSearchQueueAll; data: IBaseJob }
  | { name: JobName.SmartSearch; data: IEntityJob }
  | { name: JobName.AssetEmptyTrash; data?: IBaseJob }

  // Duplicate Detection
  | { name: JobName.AssetDetectDuplicatesQueueAll; data: IBaseJob }
  | { name: JobName.AssetDetectDuplicates; data: IEntityJob }

  // Memories
  | { name: JobName.MemoryCleanup; data?: IBaseJob }
  | { name: JobName.MemoryGenerate; data?: IBaseJob }

  // Filesystem
  | { name: JobName.FileDelete; data: IDeleteFilesJob }

  // Cleanup
  | { name: JobName.AuditLogCleanup; data?: IBaseJob }
  | { name: JobName.SessionCleanup; data?: IBaseJob }

  // Tags
  | { name: JobName.TagCleanup; data?: IBaseJob }

  // Asset Deletion
  | { name: JobName.PersonCleanup; data?: IBaseJob }
  | { name: JobName.AssetDelete; data: IAssetDeleteJob }
  | { name: JobName.AssetDeleteCheck; data?: IBaseJob }

  // Library Management
  | { name: JobName.LibrarySyncFiles; data: ILibraryFileJob }
  | { name: JobName.LibrarySyncFilesQueueAll; data: IEntityJob }
  | { name: JobName.LibrarySyncAssetsQueueAll; data: IEntityJob }
  | { name: JobName.LibrarySyncAssets; data: ILibraryBulkIdsJob }
  | { name: JobName.LibraryRemoveAsset; data: ILibraryFileJob }
  | { name: JobName.LibraryDelete; data: IEntityJob }
  | { name: JobName.LibraryScanQueueAll; data?: IBaseJob }
  | { name: JobName.LibraryDeleteCheck; data: IBaseJob }

  // Notification
  | { name: JobName.SendMail; data: IEmailJob }
  | { name: JobName.NotifyAlbumInvite; data: INotifyAlbumInviteJob }
  | { name: JobName.NotifyAlbumUpdate; data: INotifyAlbumUpdateJob }
  | { name: JobName.NotifyUserSignup; data: INotifySignupJob }

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
  uuid: string;
  /** sha1 hash of file */
  checksum: Buffer;
}

export interface UploadFile {
  uuid: string;
  checksum: Buffer;
  originalPath: string;
  originalName: string;
  size: number;
}

export type UploadRequest = {
  auth: AuthDto | null;
  fieldName: UploadFieldName;
  file: UploadFile;
  body: {
    filename?: string;
    [key: string]: unknown;
  };
};

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
export type MediaLocation = { location: string };

export interface SystemMetadata extends Record<SystemMetadataKey, Record<string, any>> {
  [SystemMetadataKey.AdminOnboarding]: { isOnboarded: boolean };
  [SystemMetadataKey.FacialRecognitionState]: { lastRun?: string };
  [SystemMetadataKey.License]: { licenseKey: string; activationKey: string; activatedAt: Date };
  [SystemMetadataKey.MediaLocation]: MediaLocation;
  [SystemMetadataKey.ReverseGeocodingState]: { lastUpdate?: string; lastImportFileName?: string };
  [SystemMetadataKey.SystemConfig]: DeepPartial<SystemConfig>;
  [SystemMetadataKey.SystemFlags]: DeepPartial<SystemFlags>;
  [SystemMetadataKey.VersionCheckState]: VersionCheckMetadata;
  [SystemMetadataKey.MemoriesState]: MemoriesState;
}

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

export type UserMetadataItem<T extends keyof UserMetadata = UserMetadataKey> = {
  key: T;
  value: UserMetadata[T];
};

export interface UserMetadata extends Record<UserMetadataKey, Record<string, any>> {
  [UserMetadataKey.Preferences]: DeepPartial<UserPreferences>;
  [UserMetadataKey.License]: { licenseKey: string; activationKey: string; activatedAt: string };
  [UserMetadataKey.Onboarding]: { isOnboarded: boolean };
}

export type AssetMetadataItem<T extends keyof AssetMetadata = AssetMetadataKey> = {
  key: T;
  value: AssetMetadata[T];
};

export interface AssetMetadata extends Record<AssetMetadataKey, Record<string, any>> {
  [AssetMetadataKey.MobileApp]: { iCloudId: string };
}
