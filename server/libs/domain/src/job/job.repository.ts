import {
  IAssetUploadedJob,
  IDeleteFileOnDiskJob,
  IExifExtractionProcessor,
  IMachineLearningJob,
  IVideoConversionProcessor,
  IReverseGeocodingProcessor,
  IUserDeletionJob,
  JpegGeneratorProcessor,
  WebpGeneratorProcessor,
} from './interfaces';
import { JobName } from './job.constants';

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
  | { name: JobName.OBJECT_DETECTION; data: IMachineLearningJob }
  | { name: JobName.IMAGE_TAGGING; data: IMachineLearningJob }
  | { name: JobName.DELETE_FILE_ON_DISK; data: IDeleteFileOnDiskJob };

export const IJobRepository = 'IJobRepository';

export interface IJobRepository {
  add(item: JobItem): Promise<void>;
}
