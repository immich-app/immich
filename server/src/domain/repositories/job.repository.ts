import { JobName, QueueName } from '../job/job.constants';

import {
  IAssetDeletionJob,
  IBaseJob,
  IDeferrableJob,
  IDeleteFilesJob,
  IEntityJob,
  ILibraryFileJob,
  ILibraryRefreshJob,
  ISidecarWriteJob,
} from '../job/job.interface';

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
  | { name: JobName.GENERATE_JPEG_THUMBNAIL; data: IEntityJob }
  | { name: JobName.GENERATE_WEBP_THUMBNAIL; data: IEntityJob }
  | { name: JobName.GENERATE_THUMBHASH_THUMBNAIL; data: IEntityJob }

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
  | { name: JobName.QUEUE_FACIAL_RECOGNITION; data: IBaseJob }
  | { name: JobName.FACIAL_RECOGNITION; data: IDeferrableJob }
  | { name: JobName.GENERATE_PERSON_THUMBNAIL; data: IEntityJob }

  // Smart Search
  | { name: JobName.QUEUE_SMART_SEARCH; data: IBaseJob }
  | { name: JobName.SMART_SEARCH; data: IEntityJob }

  // Filesystem
  | { name: JobName.DELETE_FILES; data: IDeleteFilesJob }

  // Audit Log Cleanup
  | { name: JobName.CLEAN_OLD_AUDIT_LOGS; data?: IBaseJob }

  // Asset Deletion
  | { name: JobName.PERSON_CLEANUP; data?: IBaseJob }
  | { name: JobName.ASSET_DELETION; data: IAssetDeletionJob }
  | { name: JobName.ASSET_DELETION_CHECK; data?: IBaseJob }

  // Library Management
  | { name: JobName.LIBRARY_SCAN_ASSET; data: ILibraryFileJob }
  | { name: JobName.LIBRARY_SCAN; data: ILibraryRefreshJob }
  | { name: JobName.LIBRARY_REMOVE_OFFLINE; data: IEntityJob }
  | { name: JobName.LIBRARY_DELETE; data: IEntityJob }
  | { name: JobName.LIBRARY_QUEUE_SCAN_ALL; data: IBaseJob }
  | { name: JobName.LIBRARY_QUEUE_CLEANUP; data: IBaseJob };

export type JobHandler<T = any> = (data: T) => boolean | Promise<boolean>;
export type JobItemHandler = (item: JobItem) => Promise<void>;

export const IJobRepository = 'IJobRepository';

export interface IJobRepository {
  addHandler(queueName: QueueName, concurrency: number, handler: JobItemHandler): void;
  addCronJob(name: string, expression: string, onTick: () => void, start?: boolean): void;
  updateCronJob(name: string, expression?: string, start?: boolean): void;
  deleteCronJob(name: string): void;
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
