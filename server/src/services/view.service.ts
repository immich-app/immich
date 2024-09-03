import { Inject } from '@nestjs/common';
import { AssetResponseDto, mapAsset } from 'src/dtos/asset-response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { IAssetRepository } from 'src/interfaces/asset.interface';

export class ViewService {
  constructor(@Inject(IAssetRepository) private assetRepository: IAssetRepository) {}

  getUniqueOriginalPaths(auth: AuthDto): Promise<string[]> {
    return this.assetRepository.getUniqueOriginalPaths(auth.user.id);
  }

  async getAssetsByOriginalPath(auth: AuthDto, path: string): Promise<AssetResponseDto[]> {
    const assets = await this.assetRepository.getAssetsByOriginalPath(auth.user.id, path);

    return assets.map((asset) => mapAsset(asset, { auth }));
  }
}
