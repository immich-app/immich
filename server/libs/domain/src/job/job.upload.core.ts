import { AssetType } from '@app/infra/db/entities';
import { IAssetUploadedJob } from './interfaces';
import { JobName } from './job.constants';
import { IJobRepository, Job } from './job.repository';

export class JobUploadCore {
  constructor(private repository: IJobRepository) {}

  /**
   * Post processing uploaded asset to perform the following function
   * 1. Generate JPEG Thumbnail
   * 2. Generate Webp Thumbnail
   * 3. EXIF extractor
   * 4. Reverse Geocoding
   *
   * @param job asset-uploaded
   */
  async handleAsset(job: Job<IAssetUploadedJob>) {
    const { asset, fileName } = job.data;

    await this.repository.add({ name: JobName.GENERATE_JPEG_THUMBNAIL, data: { asset } });

    // Video Conversion
    if (asset.type == AssetType.VIDEO) {
      await this.repository.add({ name: JobName.VIDEO_CONVERSION, data: { asset } });
      await this.repository.add({ name: JobName.EXTRACT_VIDEO_METADATA, data: { asset, fileName } });
    } else {
      // Extract Metadata/Exif for Images - Currently the EXIF library on the web cannot extract EXIF for video yet
      await this.repository.add({ name: JobName.EXIF_EXTRACTION, data: { asset, fileName } });
    }
  }
}
