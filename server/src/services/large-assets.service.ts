import { Injectable } from '@nestjs/common';
import { JOBS_ASSET_PAGINATION_SIZE } from 'src/constants';
import { OnJob } from 'src/decorators';
import { mapAsset } from 'src/dtos/asset-response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { LargeAssetsResponseDto } from 'src/dtos/large-assets.dto';
import { AssetFileType, JobName, JobStatus, QueueName } from 'src/enum';
import { WithoutProperty } from 'src/repositories/asset.repository';
import { BaseService } from 'src/services/base.service';
import { JobOf } from 'src/types';
import { getAssetFile } from 'src/utils/asset.util';
import { usePagination } from 'src/utils/pagination';

@Injectable()
export class LargeAssetsService extends BaseService {
  async getLargeAssets(auth: AuthDto): Promise<LargeAssetsResponseDto> {
    const largeAssets = await this.assetRepository.getLargeAssets(auth.user.id, 200);

    return { assets: largeAssets.map((asset) => mapAsset(asset, { auth })) };
  }
}
