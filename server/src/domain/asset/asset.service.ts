import { Inject } from '@nestjs/common';
import { DateTime } from 'luxon';
import { AuthUserDto } from '../auth';
import { IAssetRepository } from './asset.repository';
import { MemoryLaneDto } from './dto';
import { MapMarkerDto } from './dto/map-marker.dto';
import { mapAsset, MapMarkerResponseDto } from './response-dto';
import { MemoryLaneResponseDto } from './response-dto/memory-lane-response.dto';

export class AssetService {
  constructor(@Inject(IAssetRepository) private assetRepository: IAssetRepository) {}

  getMapMarkers(authUser: AuthUserDto, options: MapMarkerDto): Promise<MapMarkerResponseDto[]> {
    return this.assetRepository.getMapMarkers(authUser.id, options);
  }

  async getMemoryLane(authUser: AuthUserDto, dto: MemoryLaneDto): Promise<MemoryLaneResponseDto[]> {
    const target = DateTime.fromJSDate(dto.timestamp);

    const onRequest = async (yearsAgo: number): Promise<MemoryLaneResponseDto> => {
      const assets = await this.assetRepository.getByDate(authUser.id, target.minus({ years: yearsAgo }).toJSDate());
      return {
        title: `${yearsAgo} year${yearsAgo > 1 ? 's' : ''} since...`,
        assets: assets.map((a) => mapAsset(a)),
      };
    };

    const requests: Promise<MemoryLaneResponseDto>[] = [];
    for (let i = 1; i <= dto.years; i++) {
      requests.push(onRequest(i));
    }

    return Promise.all(requests).then((results) => results.filter((result) => result.assets.length > 0));
  }
}
