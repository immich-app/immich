import { AssetType } from '@app/infra/db/entities';
import { Inject } from '@nestjs/common';
import { IAssetUploadedJob, IJobRepository, JobName } from '../job';

export class AssetService {
  constructor(@Inject(IJobRepository) private jobRepository: IJobRepository) {}

  async handleAssetUpload(data: IAssetUploadedJob) {
    await this.jobRepository.queue({ name: JobName.GENERATE_JPEG_THUMBNAIL, data });

    if (data.asset.type == AssetType.VIDEO) {
      await this.jobRepository.queue({ name: JobName.VIDEO_CONVERSION, data });
      await this.jobRepository.queue({ name: JobName.EXTRACT_VIDEO_METADATA, data });
    } else {
      await this.jobRepository.queue({ name: JobName.EXIF_EXTRACTION, data });
    }
  }
}
