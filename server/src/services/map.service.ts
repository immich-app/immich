import { Injectable } from '@nestjs/common';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  CreateFavoriteLocationDto,
  FavoriteLocationResponseDto,
  UpdateFavoriteLocationDto,
} from 'src/dtos/favorite-location.dto';
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

    // TODO convert to SQL join
    const albumIds: string[] = [];
    if (options.withSharedAlbums) {
      const [ownedAlbums, sharedAlbums] = await Promise.all([
        this.albumRepository.getOwned(auth.user.id),
        this.albumRepository.getShared(auth.user.id),
      ]);
      albumIds.push(...ownedAlbums.map((album) => album.id), ...sharedAlbums.map((album) => album.id));
    }

    return this.mapRepository.getMapMarkers(userIds, albumIds, options);
  }

  async reverseGeocode(dto: MapReverseGeocodeDto) {
    const { lat: latitude, lon: longitude } = dto;
    // eventually this should probably return an array of results
    const result = await this.mapRepository.reverseGeocode({ latitude, longitude });
    return result ? [result] : [];
  }

  async getFavoriteLocations(auth: AuthDto): Promise<FavoriteLocationResponseDto[]> {
    return this.mapRepository.getFavoriteLocations(auth.user.id);
  }

  async createFavoriteLocation(auth: AuthDto, dto: CreateFavoriteLocationDto): Promise<FavoriteLocationResponseDto> {
    const entity = {
      userId: auth.user.id,
      name: dto.name,
      latitude: dto.latitude,
      longitude: dto.longitude,
    };

    return this.mapRepository.createFavoriteLocation(entity);
  }

  async updateFavoriteLocation(
    auth: AuthDto,
    id: string,
    dto: UpdateFavoriteLocationDto,
  ): Promise<FavoriteLocationResponseDto> {
    const entity = {
      userId: auth.user.id,
      id,
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.latitude !== undefined && { latitude: dto.latitude }),
      ...(dto.longitude !== undefined && { longitude: dto.longitude }),
    };
    return this.mapRepository.updateFavoriteLocation(id, auth.user.id, entity);
  }

  async deleteFavoriteLocation(id: string) {
    await this.mapRepository.deleteFavoriteLocation(id);
  }
}
