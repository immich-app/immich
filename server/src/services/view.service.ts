import { Inject } from '@nestjs/common';
import { AssetResponseDto, mapAsset } from 'src/dtos/asset-response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { Permission } from 'src/enum';
import { IAccessRepository } from 'src/interfaces/access.interface';
import { IAssetRepository } from 'src/interfaces/asset.interface';
import { IPartnerRepository } from 'src/interfaces/partner.interface';
import { requireAccess } from 'src/utils/access';

export class ViewService {
  constructor(
    @Inject(IAccessRepository) private access: IAccessRepository,
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(IPartnerRepository) private partnerRepository: IPartnerRepository,
  ) {}

  async getUniqueOriginalPaths(auth: AuthDto): Promise<string[]> {
    return this.assetRepository.getUniqueOriginalPaths(auth.user.id);
  }

  async getAssetsByOriginalPath(auth: AuthDto, path: string): Promise<AssetResponseDto[]> {
    const assets = await this.assetRepository.getAssetsByOriginalPath(auth.user.id, path);
    const ids = assets.map((a) => a.id);
    await requireAccess(this.access, { auth, permission: Permission.ASSET_READ, ids: ids });
    return assets.map((a) => mapAsset(a, { auth }));
  }
}
