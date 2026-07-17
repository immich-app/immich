import { WorkflowTrigger } from '@immich/plugin-sdk';
import { ShallowDehydrateObject } from 'kysely';
import { SystemConfig } from 'src/config';
import { VECTOR_EXTENSIONS } from 'src/constants';
import { AssetFile } from 'src/database';
import { UploadFieldName } from 'src/dtos/asset-media.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { AssetEditActionItem } from 'src/dtos/editing.dto';
import { SetMaintenanceModeDto } from 'src/dtos/maintenance.dto';
import {
  AacProfile,
  AssetOrder,
  AssetType,
  Av1Profile,
  ColorMatrix,
  ColorPrimaries,
  ColorTransfer,
  DvProfile,
  DvSignalCompatibility,
  ExifOrientation,
  H264Profile,
  HevcProfile,
  ImageFormat,
  IntegrityReport,
  JobName,
  MemoryType,
  QueueName,
  StorageFolder,
  SyncEntityType,
  SystemMetadataKey,
  TranscodeTarget,
  UserMetadataKey,
  WorkflowType,
} from 'src/enum';

export type DeepPartial<T> = T extends Date
  ? T
  : T extends Record<string, unknown>
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T extends Array<infer R>
      ? DeepPartial<R>[]
      : T;

export type RepositoryInterface<T extends object> = Pick<T, keyof T>;

export type FullsizeImageOptions = {
  format: ImageFormat;
  quality: number;
  enabled: boolean;
  progressive?: boolean;
};

export type ImageOptions = {
  format: ImageFormat;
  quality: number;
  size: number;
  progressive?: boolean;
};

export type RawImageInfo = {
  width: number;
  height: number;
  channels: 1 | 2 | 3 | 4;
};

type DecodeImageOptions = {
  colorspace: string;
  processInvalidImages: boolean;
  raw?: RawImageInfo;
  edits?: AssetEditActionItem[];
};

export interface DecodeToBufferOptions extends DecodeImageOptions {
  size?: number;
  orientation?: ExifOrientation;
}

export type GenerateThumbnailOptions = Pick<ImageOptions, 'format' | 'quality' | 'progressive'> & DecodeToBufferOptions;
export type GenerateThumbhashOptions = DecodeImageOptions;

export interface GenerateThumbnailsOptions {
  colorspace: string;
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
  codecName: string | null;
  profile: H264Profile | HevcProfile | Av1Profile | null;
  level: number | null;
  frameCount: number;
  frameRate: number | null;
  timeBase: number | null;
  bitrate: number;
  pixelFormat: string;
  colorPrimaries: ColorPrimaries;
  colorMatrix: ColorMatrix;
  colorTransfer: ColorTransfer;
  dvProfile: DvProfile | null;
  dvLevel: number | null;
  dvBlSignalCompatibilityId: DvSignalCompatibility | null;
}

export interface AudioStreamInfo {
  index: number;
  codecName: string | null;
  profile: AacProfile | null;
  bitrate: number;
}

/** Packet-derived video data needed for accurate HLS playlists. */
export interface VideoPacketInfo {
  /** Sum of source packet duration across all packets (includes discard). */
  totalDuration: number;
  /** Post-discard packet count. */
  packetCount: number;
  /** Output CFR frame count at `packetCount / format.duration`. */
  outputFrames: number;
  /** All keyframe PTS in source ticks, including pre-roll discard keyframes. */
  keyframePts: number[];
  /** Cumulative packet duration through each keyframe, inclusive. */
  keyframeAccDuration: number[];
  /** Each keyframe's own packet duration (needed for VFR). */
  keyframeOwnDuration: number[];
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

export interface VideoTuning {
  strictGop: boolean;
  lowLatency: boolean;
}

export interface HlsCommandOptions {
  initFilename: string;
  inputPath: string;
  packetCount: number;
  playlistFilename: string;
  seekSeconds?: number;
  segmentDuration: number;
  segmentFilename: string;
  startSegment: number;
  target: TranscodeTarget;
  timeBase: number;
  totalDuration: number;
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
    video: VideoStreamInfo,
    audio?: AudioStreamInfo,
    format?: VideoFormat,
  ): TranscodeCommand;
  getHlsCommand(options: HlsCommandOptions, video: VideoStreamInfo, audio?: AudioStreamInfo): string[];
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

export type JobSource = 'upload' | 'sidecar-write' | 'copy' | 'edit';
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
  senderName: string;
}

export interface INotifyAlbumUpdateJob extends IEntityJob, IDelayedJob {
  recipientId: string;
}

export type IWorkflowJob<T extends WorkflowType = WorkflowType> = {
  id: string;
  trigger: WorkflowTrigger;
  type: T;
};

export interface IIntegrityJob {
  refreshOnly?: boolean;
}

export interface IIntegrityDeleteReportTypeJob {
  type?: IntegrityReport;
}

export interface IIntegrityDeleteReportsJob {
  reports: {
    id: string;
    assetId: string | null;
    fileAssetId: string | null;
    path: string;
  }[];
}

export interface IIntegrityUntrackedFilesJob {
  type: 'asset' | 'asset_file';
  paths: string[];
}

export interface IIntegrityMissingFilesJob {
  items: ({ path: string; reportId: string | null } & (
    { assetId: string; fileAssetId: null } | { assetId: null; fileAssetId: string }
  ))[];
}

export interface IIntegrityPathWithReportJob {
  items: { path: string; reportId: string | null }[];
}

export interface IIntegrityPathWithChecksumJob {
  items: { path: string; reportId: string | null; checksum?: string | null }[];
}

export interface JobCounts {
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  waiting: number;
  paused: number;
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
  | { name: JobName.SidecarWrite; data: IEntityJob }

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
  | { name: JobName.SessionCleanup; data?: IBaseJob }
  | { name: JobName.HlsSessionCleanup; data?: IBaseJob }

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
  | { name: JobName.VersionCheck; data: IBaseJob }

  // OCR
  | { name: JobName.OcrQueueAll; data: IBaseJob }
  | { name: JobName.Ocr; data: IEntityJob }

  // Workflow
  | { name: JobName.WorkflowAssetTrigger; data: { workflowId: string; assetId: string } }

  // Integrity
  | { name: JobName.IntegrityUntrackedFilesQueueAll; data?: IIntegrityJob }
  | { name: JobName.IntegrityUntrackedFiles; data: IIntegrityUntrackedFilesJob }
  | { name: JobName.IntegrityUntrackedFilesRefresh; data: IIntegrityPathWithReportJob }
  | { name: JobName.IntegrityMissingFilesQueueAll; data?: IIntegrityJob }
  | { name: JobName.IntegrityMissingFiles; data: IIntegrityPathWithReportJob }
  | { name: JobName.IntegrityMissingFilesRefresh; data: IIntegrityPathWithReportJob }
  | { name: JobName.IntegrityChecksumFiles; data?: IIntegrityJob }
  | { name: JobName.IntegrityChecksumFilesRefresh; data?: IIntegrityPathWithChecksumJob }
  | { name: JobName.IntegrityDeleteReportType; data: IIntegrityDeleteReportTypeJob }
  | { name: JobName.IntegrityDeleteReports; data: IIntegrityDeleteReportsJob }

  // Editor
  | { name: JobName.AssetEditThumbnailGeneration; data: IEntityJob };

export type VectorExtension = (typeof VECTOR_EXTENSIONS)[number];

export interface ExtensionVersion {
  name: VectorExtension;
  availableVersion: string | null;
  installedVersion: string | null;
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

export interface UploadBody {
  filename?: string;
  [key: string]: unknown;
}

export type UploadRequest = {
  auth: AuthDto | null;
  fieldName: UploadFieldName;
  file: UploadFile;
  body: UploadBody;
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
  fileSizeInByte: number | null;
  files: AssetFile[];
  make: string | null;
  model: string | null;
  lensModel: string | null;
};

export type OnThisDayData = { year: number };

export interface MemoryData {
  [MemoryType.OnThisDay]: OnThisDayData;
}

export type VersionCheckMetadata = { checkedAt: string; releaseVersion: string };
export type SystemFlags = { mountChecks: Record<StorageFolder, boolean> };
export type MaintenanceModeState =
  { isMaintenanceMode: true; secret: string; action?: SetMaintenanceModeDto } | { isMaintenanceMode: false };
export type MemoriesState = {
  /** memories have already been created through this date */
  lastOnThisDayDate: string;
};
export type MediaLocation = { location: string };

export interface SystemMetadata extends Record<SystemMetadataKey, Record<string, any>> {
  [SystemMetadataKey.AdminOnboarding]: { isOnboarded: boolean };
  [SystemMetadataKey.FacialRecognitionState]: { lastRun?: string };
  [SystemMetadataKey.License]: { licenseKey: string; activationKey: string; activatedAt: Date };
  [SystemMetadataKey.MaintenanceMode]: MaintenanceModeState;
  [SystemMetadataKey.MediaLocation]: MediaLocation;
  [SystemMetadataKey.ReverseGeocodingState]: { lastUpdate?: string; lastImportFileName?: string };
  [SystemMetadataKey.SystemConfig]: DeepPartial<SystemConfig>;
  [SystemMetadataKey.SystemFlags]: DeepPartial<SystemFlags>;
  [SystemMetadataKey.VersionCheckState]: VersionCheckMetadata;
  [SystemMetadataKey.MemoriesState]: MemoriesState;
  [SystemMetadataKey.IntegrityChecksumCheckpoint]: { date?: string };
}

export type UserPreferences = {
  albums: {
    defaultAssetOrder: AssetOrder;
  };
  folders: {
    enabled: boolean;
    sidebarWeb: boolean;
  };
  memories: {
    enabled: boolean;
    duration: number;
  };
  people: {
    enabled: boolean;
    sidebarWeb: boolean;
    minimumFaces: number;
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
  recentlyAdded: {
    sidebarWeb: boolean;
  };
};

export type UserMetadataItem<T extends keyof UserMetadata = UserMetadataKey> = {
  key: T;
  value: UserMetadata[T];
};

export interface UserMetadata extends Record<UserMetadataKey, Record<string, any>> {
  [UserMetadataKey.Preferences]: DeepPartial<UserPreferences>;
  [UserMetadataKey.License]: { licenseKey: string; activationKey: string; activatedAt: string };
  [UserMetadataKey.Onboarding]: { isOnboarded: boolean };
}

export type MaybeDehydrated<T> = T | ShallowDehydrateObject<T>;

export type JSONSchemaType = 'string' | 'number' | 'integer' | 'boolean' | 'object';

export type JSONSchemaProperty = {
  type: JSONSchemaType;
  description?: string;
  default?: any;
  enum?: string[];
  array?: boolean;
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export interface ClassConstructor<T = any> extends Function {
  new (...args: any[]): T;
}
