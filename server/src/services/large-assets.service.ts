import { Injectable } from '@nestjs/common';
import { mapAsset } from 'src/dtos/asset-response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { LargeAssetsResponseDto } from 'src/dtos/large-assets.dto';
import { BaseService } from 'src/services/base.service';

@Injectable()
export class LargeAssetsService extends BaseService {
  async getLargeAssets(auth: AuthDto, take: number): Promise<LargeAssetsResponseDto> {
    const largeAssets = await this.assetRepository.getLargeAssets(auth.user.id, take);

    return { assets: largeAssets.map((asset) => mapAsset(asset, { auth })) };
  }
}
