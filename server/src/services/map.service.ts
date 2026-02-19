import { Injectable } from '@nestjs/common';
import { AuthDto } from 'src/dtos/auth.dto';
import { MapMarkerDto, MapMarkerResponseDto, MapReverseGeocodeDto } from 'src/dtos/map.dto';
import { BaseService } from 'src/services/base.service';
import { AssetOwnerFilter, getMyPartners, PartnerDateConstraint } from 'src/utils/asset.util';

@Injectable()
export class MapService extends BaseService {
  async getMapMarkers(auth: AuthDto, options: MapMarkerDto): Promise<MapMarkerResponseDto[]> {
    const ownerFilter: AssetOwnerFilter = { userIds: [auth.user.id] };
    if (options.withPartners) {
      const partners = await getMyPartners({ userId: auth.user.id, repository: this.partnerRepository });
      for (const partner of partners) {
        if (partner.shareFromDate) {
          (ownerFilter.partnerDateConstraints ??= []).push({
            userId: partner.id,
            shareFromDate: partner.shareFromDate,
          });
        } else {
          ownerFilter.userIds!.push(partner.id);
        }
      }
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

    return this.mapRepository.getMapMarkers(ownerFilter, albumIds, options);
  }

  async reverseGeocode(dto: MapReverseGeocodeDto) {
    const { lat: latitude, lon: longitude } = dto;
    // eventually this should probably return an array of results
    const result = await this.mapRepository.reverseGeocode({ latitude, longitude });
    return result ? [result] : [];
  }
}
