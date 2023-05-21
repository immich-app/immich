import { AssetEntity, AssetType } from '@app/infra/entities';
import { Inject } from '@nestjs/common';
import { AuthUserDto } from '../auth';
import { IAssetUploadedJob, IJobRepository, JobName } from '../job';
import { AssetCore } from './asset.core';
import { IAssetRepository } from './asset.repository';
import { MapMarkerDto } from './dto/map-marker.dto';
import { MapMarkerResponseDto } from './response-dto';

export class AssetService {
  private assetCore: AssetCore;

  constructor(
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
  ) {
    this.assetCore = new AssetCore(assetRepository, jobRepository);
  }

  async handleAssetUpload(data: IAssetUploadedJob) {
    await this.jobRepository.queue({ name: JobName.GENERATE_JPEG_THUMBNAIL, data });

    if (data.asset.type == AssetType.VIDEO) {
      await this.jobRepository.queue({ name: JobName.VIDEO_CONVERSION, data });
      await this.jobRepository.queue({ name: JobName.EXTRACT_VIDEO_METADATA, data });
    } else {
      await this.jobRepository.queue({ name: JobName.EXIF_EXTRACTION, data });
    }
  }

  save(asset: Partial<AssetEntity>) {
    return this.assetCore.save(asset);
  }

  getMapMarkers(authUser: AuthUserDto, options: MapMarkerDto): Promise<MapMarkerResponseDto[]> {
    return this.assetRepository.getMapMarkers(authUser.id, options);
  }
}
