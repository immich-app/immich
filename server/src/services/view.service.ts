import { Injectable } from '@nestjs/common';
import { AssetResponseDto, mapAsset } from 'src/dtos/asset-response.dto.js';
import { AuthDto } from 'src/dtos/auth.dto.js';
import { BaseService } from 'src/services/base.service.js';

@Injectable()
export class ViewService extends BaseService {
  getUniqueOriginalPaths(auth: AuthDto): Promise<string[]> {
    return this.viewRepository.getUniqueOriginalPaths(auth.user.id);
  }

  async getAssetsByOriginalPath(auth: AuthDto, path: string): Promise<AssetResponseDto[]> {
    const assets = await this.viewRepository.getAssetsByOriginalPath(auth.user.id, path);
    return assets.map((asset) => mapAsset(asset, { auth }));
  }
}
