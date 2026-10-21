import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthDto } from 'src/dtos/auth.dto.js';
import { FavoriteLocationCreateDto, FavoriteLocationResponseDto } from 'src/dtos/favorite-location.dto.js';
import { MapMarkerDto, MapMarkerResponseDto, MapReverseGeocodeDto } from 'src/dtos/map.dto.js';
import { BaseService } from 'src/services/base.service.js';
import { getMyPartnerIds } from 'src/utils/asset.util.js';

@Injectable()
export class MapService extends BaseService {
  async getMapMarkers(auth: AuthDto, options: MapMarkerDto): Promise<MapMarkerResponseDto[]> {
    const userIds = [auth.user.id];
    if (options.withPartners) {
      const partnerIds = await getMyPartnerIds({ userId: auth.user.id, repository: this.partnerRepository });
      userIds.push(...partnerIds);
    }

    const albumIds = options.withSharedAlbums ? await this.albumRepository.getAllIds(auth.user.id) : [];

    return this.mapRepository.getMapMarkers(auth.user.id, userIds, albumIds, options);
  }

  async reverseGeocode(dto: MapReverseGeocodeDto) {
    const { lat: latitude, lon: longitude } = dto;
    // eventually this should probably return an array of results
    const result = await this.mapRepository.reverseGeocode({ latitude, longitude });
    return result ? [result] : [];
  }

  getFavoriteLocations(auth: AuthDto): Promise<FavoriteLocationResponseDto[]> {
    return this.mapRepository.getFavoriteLocations(auth.user.id);
  }

  createFavoriteLocation(auth: AuthDto, dto: FavoriteLocationCreateDto): Promise<FavoriteLocationResponseDto> {
    return this.mapRepository.createFavoriteLocation({ ...dto, userId: auth.user.id });
  }

  async deleteFavoriteLocation(auth: AuthDto, id: string): Promise<void> {
    const deleted = await this.mapRepository.deleteFavoriteLocation(id, auth.user.id);
    if (!deleted) {
      throw new NotFoundException('Favorite location not found');
    }
  }
}
