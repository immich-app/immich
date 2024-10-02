import { EmailImageAttachment } from 'src/interfaces/notification.interface';

export enum QueueName {
  THUMBNAIL_GENERATION = 'thumbnailGeneration',
  METADATA_EXTRACTION = 'metadataExtraction',
  VIDEO_CONVERSION = 'videoConversion',
  FACE_DETECTION = 'faceDetection',
  FACIAL_RECOGNITION = 'facialRecognition',
  SMART_SEARCH = 'smartSearch',
  DUPLICATE_DETECTION = 'duplicateDetection',
  BACKGROUND_TASK = 'backgroundTask',
  STORAGE_TEMPLATE_MIGRATION = 'storageTemplateMigration',
  MIGRATION = 'migration',
  SEARCH = 'search',
  SIDECAR = 'sidecar',
  LIBRARY = 'library',
  NOTIFICATION = 'notifications',
}

export type ConcurrentQueueName = Exclude<
  QueueName,
  QueueName.STORAGE_TEMPLATE_MIGRATION | QueueName.FACIAL_RECOGNITION | QueueName.DUPLICATE_DETECTION
>;

export enum JobCommand {
  START = 'start',
  PAUSE = 'pause',
  RESUME = 'resume',
  EMPTY = 'empty',
  CLEAR_FAILED = 'clear-failed',
}

export enum JobName {
  // conversion
  QUEUE_VIDEO_CONVERSION = 'queue-video-conversion',
  VIDEO_CONVERSION = 'video-conversion',

  // thumbnails
  QUEUE_GENERATE_THUMBNAILS = 'queue-generate-thumbnails',
  GENERATE_THUMBNAILS = 'generate-thumbnails',
  GENERATE_PERSON_THUMBNAIL = 'generate-person-thumbnail',

  // metadata
  QUEUE_METADATA_EXTRACTION = 'queue-metadata-extraction',
  METADATA_EXTRACTION = 'metadata-extraction',
  LINK_LIVE_PHOTOS = 'link-live-photos',

  // user
  USER_DELETION = 'user-deletion',
  USER_DELETE_CHECK = 'user-delete-check',
  USER_SYNC_USAGE = 'user-sync-usage',

  // asset
  ASSET_DELETION = 'asset-deletion',
  ASSET_DELETION_CHECK = 'asset-deletion-check',

  // storage template
  STORAGE_TEMPLATE_MIGRATION = 'storage-template-migration',
  STORAGE_TEMPLATE_MIGRATION_SINGLE = 'storage-template-migration-single',

  // tags
  TAG_CLEANUP = 'tag-cleanup',

  // migration
  QUEUE_MIGRATION = 'queue-migration',
  MIGRATE_ASSET = 'migrate-asset',
  MIGRATE_PERSON = 'migrate-person',

  // facial recognition
  PERSON_CLEANUP = 'person-cleanup',
  QUEUE_FACE_DETECTION = 'queue-face-detection',
  FACE_DETECTION = 'face-detection',
  QUEUE_FACIAL_RECOGNITION = 'queue-facial-recognition',
  FACIAL_RECOGNITION = 'facial-recognition',

  // library management
  LIBRARY_QUEUE_SYNC_FILES = 'library-queue-sync-files',
  LIBRARY_QUEUE_SYNC_ASSETS = 'library-queue-sync-assets',
  LIBRARY_SYNC_FILE = 'library-sync-file',
  LIBRARY_SYNC_ASSET = 'library-sync-asset',
  LIBRARY_DELETE = 'library-delete',
  LIBRARY_QUEUE_SYNC_ALL = 'library-queue-sync-all',
  LIBRARY_QUEUE_CLEANUP = 'library-queue-cleanup',

  // cleanup
  DELETE_FILES = 'delete-files',
  CLEAN_OLD_AUDIT_LOGS = 'clean-old-audit-logs',
  CLEAN_OLD_SESSION_TOKENS = 'clean-old-session-tokens',

  // smart search
  QUEUE_SMART_SEARCH = 'queue-smart-search',
  SMART_SEARCH = 'smart-search',

  QUEUE_TRASH_EMPTY = 'queue-trash-empty',

  // duplicate detection
  QUEUE_DUPLICATE_DETECTION = 'queue-duplicate-detection',
  DUPLICATE_DETECTION = 'duplicate-detection',

  // XMP sidecars
  QUEUE_SIDECAR = 'queue-sidecar',
  SIDECAR_DISCOVERY = 'sidecar-discovery',
  SIDECAR_SYNC = 'sidecar-sync',
  SIDECAR_WRITE = 'sidecar-write',

  // Notification
  NOTIFY_SIGNUP = 'notify-signup',
  NOTIFY_ALBUM_INVITE = 'notify-album-invite',
  NOTIFY_ALBUM_UPDATE = 'notify-album-update',
  SEND_EMAIL = 'notification-send-email',

  // Version check
  VERSION_CHECK = 'version-check',
}

export const JOBS_ASSET_PAGINATION_SIZE = 1000;
export const JOBS_LIBRARY_PAGINATION_SIZE = 10_000;

export interface IBaseJob {
  force?: boolean;
}

export interface IEntityJob extends IBaseJob {
  id: string;
  source?: 'upload' | 'sidecar-write' | 'copy';
  notify?: boolean;
}

export interface IAssetDeleteJob extends IEntityJob {
  deleteOnDisk: boolean;
}

export interface ILibraryFileJob extends IEntityJob {
  ownerId: string;
  assetPath: string;
}

export interface ILibraryAssetJob extends IEntityJob {
  importPaths: string[];
  exclusionPatterns: string[];
}

export interface IBulkEntityJob extends IBaseJob {
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

export interface INotifyAlbumUpdateJob extends IEntityJob {
  senderId: string;
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

export enum QueueCleanType {
  FAILED = 'failed',
}

export type JobItem =
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
  | { name: JobName.MIGRATE_ASSET; data?: IEntityJob }
  | { name: JobName.MIGRATE_PERSON; data?: IEntityJob }

  // Metadata Extraction
  | { name: JobName.QUEUE_METADATA_EXTRACTION; data: IBaseJob }
  | { name: JobName.METADATA_EXTRACTION; data: IEntityJob }
  | { name: JobName.LINK_LIVE_PHOTOS; data: IEntityJob }
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
  | { name: JobName.LIBRARY_SYNC_FILE; data: ILibraryFileJob }
  | { name: JobName.LIBRARY_QUEUE_SYNC_FILES; data: IEntityJob }
  | { name: JobName.LIBRARY_QUEUE_SYNC_ASSETS; data: IEntityJob }
  | { name: JobName.LIBRARY_SYNC_ASSET; data: IEntityJob }
  | { name: JobName.LIBRARY_DELETE; data: IEntityJob }
  | { name: JobName.LIBRARY_QUEUE_SYNC_ALL; data?: IBaseJob }
  | { name: JobName.LIBRARY_QUEUE_CLEANUP; data: IBaseJob }

  // Notification
  | { name: JobName.SEND_EMAIL; data: IEmailJob }
  | { name: JobName.NOTIFY_ALBUM_INVITE; data: INotifyAlbumInviteJob }
  | { name: JobName.NOTIFY_ALBUM_UPDATE; data: INotifyAlbumUpdateJob }
  | { name: JobName.NOTIFY_SIGNUP; data: INotifySignupJob }

  // Version check
  | { name: JobName.VERSION_CHECK; data: IBaseJob };

export enum JobStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

export type JobHandler<T = any> = (data: T) => Promise<JobStatus>;
export type JobItemHandler = (item: JobItem) => Promise<void>;

export const IJobRepository = 'IJobRepository';

export interface IJobRepository {
  addHandler(queueName: QueueName, concurrency: number, handler: JobItemHandler): void;
  addCronJob(name: string, expression: string, onTick: () => void, start?: boolean): void;
  updateCronJob(name: string, expression?: string, start?: boolean): void;
  setConcurrency(queueName: QueueName, concurrency: number): void;
  queue(item: JobItem): Promise<void>;
  queueAll(items: JobItem[]): Promise<void>;
  pause(name: QueueName): Promise<void>;
  resume(name: QueueName): Promise<void>;
  empty(name: QueueName): Promise<void>;
  clear(name: QueueName, type: QueueCleanType): Promise<string[]>;
  getQueueStatus(name: QueueName): Promise<QueueStatus>;
  getJobCounts(name: QueueName): Promise<JobCounts>;
  waitForQueueCompletion(...queues: QueueName[]): Promise<void>;
}
