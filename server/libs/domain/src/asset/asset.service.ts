import { Inject } from '@nestjs/common';
import { AuthUserDto } from '../auth';
import { IAssetRepository } from './asset.repository';
import { MapMarkerDto } from './dto/map-marker.dto';
import { MapMarkerResponseDto } from './response-dto';

export class AssetService {
  constructor(@Inject(IAssetRepository) private assetRepository: IAssetRepository) {}

  getMapMarkers(authUser: AuthUserDto, options: MapMarkerDto): Promise<MapMarkerResponseDto[]> {
    return this.assetRepository.getMapMarkers(authUser.id, options);
  }
}
