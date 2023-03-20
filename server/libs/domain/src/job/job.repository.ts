import { JobName, QueueName } from './job.constants';
import {
  IAssetJob,
  IAssetUploadedJob,
  IBaseJob,
  IBulkEntityJob,
  IDeleteFilesJob,
  IReverseGeocodingJob,
  IUserDeletionJob,
} from './job.interface';

export interface JobCounts {
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  waiting: number;
}

export type JobItem =
  // Asset Upload
  | { name: JobName.ASSET_UPLOADED; data: IAssetUploadedJob }

  // Transcoding
  | { name: JobName.QUEUE_VIDEO_CONVERSION; data: IBaseJob }
  | { name: JobName.VIDEO_CONVERSION; data: IAssetJob }

  // Thumbnails
  | { name: JobName.QUEUE_GENERATE_THUMBNAILS; data: IBaseJob }
  | { name: JobName.GENERATE_JPEG_THUMBNAIL; data: IAssetJob }
  | { name: JobName.GENERATE_WEBP_THUMBNAIL; data: IAssetJob }

  // User Deletion
  | { name: JobName.USER_DELETE_CHECK }
  | { name: JobName.USER_DELETION; data: IUserDeletionJob }

  // Storage Template
  | { name: JobName.STORAGE_TEMPLATE_MIGRATION }
  | { name: JobName.SYSTEM_CONFIG_CHANGE }

  // Metadata Extraction
  | { name: JobName.QUEUE_METADATA_EXTRACTION; data: IBaseJob }
  | { name: JobName.EXIF_EXTRACTION; data: IAssetUploadedJob }
  | { name: JobName.EXTRACT_VIDEO_METADATA; data: IAssetUploadedJob }
  | { name: JobName.REVERSE_GEOCODING; data: IReverseGeocodingJob }

  // Object Tagging
  | { name: JobName.QUEUE_OBJECT_TAGGING; data: IBaseJob }
  | { name: JobName.DETECT_OBJECTS; data: IAssetJob }
  | { name: JobName.CLASSIFY_IMAGE; data: IAssetJob }

  // Clip Embedding
  | { name: JobName.QUEUE_ENCODE_CLIP; data: IBaseJob }
  | { name: JobName.ENCODE_CLIP; data: IAssetJob }

  // Filesystem
  | { name: JobName.DELETE_FILES; data: IDeleteFilesJob }

  // Search
  | { name: JobName.SEARCH_INDEX_ASSETS }
  | { name: JobName.SEARCH_INDEX_ASSET; data: IBulkEntityJob }
  | { name: JobName.SEARCH_INDEX_ALBUMS }
  | { name: JobName.SEARCH_INDEX_ALBUM; data: IBulkEntityJob }
  | { name: JobName.SEARCH_REMOVE_ASSET; data: IBulkEntityJob }
  | { name: JobName.SEARCH_REMOVE_ALBUM; data: IBulkEntityJob };

export const IJobRepository = 'IJobRepository';

export interface IJobRepository {
  queue(item: JobItem): Promise<void>;
  pause(name: QueueName): Promise<void>;
  empty(name: QueueName): Promise<void>;
  isActive(name: QueueName): Promise<boolean>;
  getJobCounts(name: QueueName): Promise<JobCounts>;
}
