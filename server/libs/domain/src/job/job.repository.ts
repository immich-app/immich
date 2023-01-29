import {
  IAssetUploadedJob,
  IDeleteFileOnDiskJob,
  IExifExtractionProcessor,
  IMachineLearningJob,
  IVideoConversionProcessor,
  IReverseGeocodingProcessor,
  IUserDeletionJob,
  IVideoLengthExtractionProcessor,
  JpegGeneratorProcessor,
  WebpGeneratorProcessor,
} from './interfaces';
import { JobName, QueueName } from './job.constants';

export interface JobCounts {
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  waiting: number;
}

export interface Job<T> {
  data: T;
}

export type JobItem =
  | { name: JobName.ASSET_UPLOADED; data: IAssetUploadedJob }
  | { name: JobName.VIDEO_CONVERSION; data: IVideoConversionProcessor }
  | { name: JobName.GENERATE_JPEG_THUMBNAIL; data: JpegGeneratorProcessor }
  | { name: JobName.GENERATE_WEBP_THUMBNAIL; data: WebpGeneratorProcessor }
  | { name: JobName.EXIF_EXTRACTION; data: IExifExtractionProcessor }
  | { name: JobName.REVERSE_GEOCODING; data: IReverseGeocodingProcessor }
  | { name: JobName.USER_DELETION; data: IUserDeletionJob }
  | { name: JobName.TEMPLATE_MIGRATION }
  | { name: JobName.CONFIG_CHANGE }
  | { name: JobName.CHECKSUM_GENERATION }
  | { name: JobName.EXTRACT_VIDEO_METADATA; data: IVideoLengthExtractionProcessor }
  | { name: JobName.OBJECT_DETECTION; data: IMachineLearningJob }
  | { name: JobName.IMAGE_TAGGING; data: IMachineLearningJob }
  | { name: JobName.DELETE_FILE_ON_DISK; data: IDeleteFileOnDiskJob };

export const IJobRepository = 'IJobRepository';

export interface IJobRepository {
  empty(name: QueueName): Promise<void>;
  add(item: JobItem): Promise<void>;
  isActive(name: QueueName): Promise<boolean>;
  getJobCounts(name: QueueName): Promise<JobCounts>;
}
