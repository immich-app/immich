import { Inject } from '@nestjs/common';
import { AuthUserDto } from '../auth';
import { IAssetRepository } from './asset.repository';
import { MapMarkerDto } from './dto/map-marker.dto';
import { AssetResponseDto, MapMarkerResponseDto, mapAsset } from './response-dto';
import { MemoryLaneResponseDto } from './response-dto/memory-lane-response.dto';

export class AssetService {
  constructor(@Inject(IAssetRepository) private assetRepository: IAssetRepository) {}

  getMapMarkers(authUser: AuthUserDto, options: MapMarkerDto): Promise<MapMarkerResponseDto[]> {
    return this.assetRepository.getMapMarkers(authUser.id, options);
  }

  async getMemoryLane(authUser: AuthUserDto): Promise<MemoryLaneResponseDto[]> {
    const result: MemoryLaneResponseDto[] = [];
    const seed = parseInt(authUser.id.split('-')[0], 16);

    // X Year on this day - go back 30 years
    const years = Array.from({ length: 30 }, (_, i) => {
      const today = new Date();
      const year = today.getFullYear() - i - 1;
      return new Date(year, today.getMonth(), today.getDate());
    });

    for (const year of years) {
      const assets = await this.assetRepository.getByDate(authUser.id, year);
      result.push({
        year: year.getFullYear(),
        assets: assets.map((a) => mapAsset(a)),
      });
    }

    return result;
  }
}
