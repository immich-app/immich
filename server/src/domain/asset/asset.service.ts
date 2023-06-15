import { Inject } from '@nestjs/common';
import { AuthUserDto } from '../auth';
import { IAssetRepository } from './asset.repository';
import { MapMarkerDto } from './dto/map-marker.dto';
import { MapMarkerResponseDto, mapAsset } from './response-dto';
import { MemoryLaneResponseDto } from './response-dto/memory-lane-response.dto';
import { DateTime } from 'luxon';

export class AssetService {
  constructor(@Inject(IAssetRepository) private assetRepository: IAssetRepository) {}

  getMapMarkers(authUser: AuthUserDto, options: MapMarkerDto): Promise<MapMarkerResponseDto[]> {
    return this.assetRepository.getMapMarkers(authUser.id, options);
  }

  async getMemoryLane(authUser: AuthUserDto, timezone: string): Promise<MemoryLaneResponseDto[]> {
    const result: MemoryLaneResponseDto[] = [];

    const luxonDate = DateTime.fromISO(new Date().toISOString(), { zone: timezone });
    const today = new Date(luxonDate.year, luxonDate.month - 1, luxonDate.day);

    const years = Array.from({ length: 30 }, (_, i) => {
      const year = today.getFullYear() - i - 1;
      return new Date(year, today.getMonth(), today.getDate());
    });

    for (const year of years) {
      const assets = await this.assetRepository.getByDate(authUser.id, year);

      if (assets.length > 0) {
        const yearGap = today.getFullYear() - year.getFullYear();
        const memory = new MemoryLaneResponseDto();
        memory.title = `${yearGap} year${yearGap > 1 && 's'} since...`;
        memory.assets = assets.map((a) => mapAsset(a));

        result.push(memory);
      }
    }

    return result;
  }
}
