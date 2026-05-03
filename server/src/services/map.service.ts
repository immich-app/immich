import { Injectable } from '@nestjs/common';
import { AuthDto } from 'src/dtos/auth.dto';
import { MapMarkerDto, MapMarkerResponseDto, MapReverseGeocodeDto } from 'src/dtos/map.dto';
import { BaseService } from 'src/services/base.service';
import { getMyPartnerIds } from 'src/utils/asset.util';

@Injectable()
export class MapService extends BaseService {
  async getMapMarkers(auth: AuthDto, options: MapMarkerDto): Promise<MapMarkerResponseDto[]> {
    const userIds = [auth.user.id];
    if (options.withPartners) {
      const partnerIds = await getMyPartnerIds({ userId: auth.user.id, repository: this.partnerRepository });
      userIds.push(...partnerIds);
    }

    const albumIds: string[] = [];
    if (options.withSharedAlbums) {
      const albums = await this.albumRepository.getAll(auth.user.id, { select: ['id'] });
      albumIds.push(...albums.map((album) => album.id));
    }

    return this.mapRepository.getMapMarkers(userIds, albumIds, options);
  }

  async reverseGeocode(dto: MapReverseGeocodeDto) {
    const { lat: latitude, lon: longitude } = dto;
    // eventually this should probably return an array of results
    const result = await this.mapRepository.reverseGeocode({ latitude, longitude });
    return result ? [result] : [];
  }
}
