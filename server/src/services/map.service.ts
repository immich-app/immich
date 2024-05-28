import { Inject } from '@nestjs/common';
import { SystemConfigCore } from 'src/cores/system-config.core';
import { AuthDto } from 'src/dtos/auth.dto';
import { MapMarkerDto, MapMarkerResponseDto } from 'src/dtos/search.dto';
import { IAlbumRepository } from 'src/interfaces/album.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IMapRepository } from 'src/interfaces/map.interface';
import { IPartnerRepository } from 'src/interfaces/partner.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';

export class MapService {
  private configCore: SystemConfigCore;

  constructor(
    @Inject(IAlbumRepository) private albumRepository: IAlbumRepository,
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
    @Inject(IPartnerRepository) private partnerRepository: IPartnerRepository,
    @Inject(IMapRepository) private mapRepository: IMapRepository,
    @Inject(ISystemMetadataRepository) private systemMetadataRepository: ISystemMetadataRepository,
  ) {
    this.logger.setContext(MapService.name);
    this.configCore = SystemConfigCore.create(systemMetadataRepository, logger);
  }

  async getMapMarkers(auth: AuthDto, options: MapMarkerDto): Promise<MapMarkerResponseDto[]> {
    const userIds: string[] = [auth.user.id];
    // TODO convert to SQL join
    if (options.withPartners) {
      const partners = await this.partnerRepository.getAll(auth.user.id);
      const partnersIds = partners
        .filter((partner) => partner.sharedBy && partner.sharedWith && partner.sharedById != auth.user.id)
        .map((partner) => partner.sharedById);
      userIds.push(...partnersIds);
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

  async getMapStyle(theme: 'light' | 'dark') {
    const { map } = await this.configCore.getConfig();
    const styleUrl = theme === 'dark' ? map.darkStyle : map.lightStyle;

    if (styleUrl) {
      return this.mapRepository.fetchStyle(styleUrl);
    }

    return JSON.parse(await this.systemMetadataRepository.readFile(`./resources/style-${theme}.json`));
  }
}
