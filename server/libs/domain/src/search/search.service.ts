import { AssetEntity } from '@app/infra/db/entities';
import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IAlbumRepository } from '../album/album.repository';
import { IAssetRepository } from '../asset/asset.repository';
import { AuthUserDto } from '../auth';
import { IAlbumJob, IAssetJob, IDeleteJob, IJobRepository, JobName } from '../job';
import { SearchDto } from './dto';
import { SearchConfigResponseDto, SearchResponseDto } from './response-dto';
import { ISearchRepository, SearchCollection, SearchExploreItem } from './search.repository';

@Injectable()
export class SearchService {
  private logger = new Logger(SearchService.name);
  private enabled: boolean;

  constructor(
    @Inject(IAlbumRepository) private albumRepository: IAlbumRepository,
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(ISearchRepository) private searchRepository: ISearchRepository,
    configService: ConfigService,
  ) {
    this.enabled = configService.get('TYPESENSE_ENABLED') !== 'false';
  }

  isEnabled() {
    return this.enabled;
  }

  getConfig(): SearchConfigResponseDto {
    return {
      enabled: this.enabled,
    };
  }

  async bootstrap() {
    if (!this.enabled) {
      return;
    }

    this.logger.log('Running bootstrap');
    await this.searchRepository.setup();

    const migrationStatus = await this.searchRepository.checkMigrationStatus();
    if (migrationStatus[SearchCollection.ASSETS]) {
      this.logger.debug('Queueing job to re-index all assets');
      await this.jobRepository.queue({ name: JobName.SEARCH_INDEX_ASSETS });
    }
    if (migrationStatus[SearchCollection.ALBUMS]) {
      this.logger.debug('Queueing job to re-index all albums');
      await this.jobRepository.queue({ name: JobName.SEARCH_INDEX_ALBUMS });
    }
  }

  async getExploreData(authUser: AuthUserDto): Promise<SearchExploreItem<AssetEntity>[]> {
    this.assertEnabled();
    return this.searchRepository.explore(authUser.id);
  }

  async search(authUser: AuthUserDto, dto: SearchDto): Promise<SearchResponseDto> {
    this.assertEnabled();

    const query = dto.query || '*';

    return {
      assets: (await this.searchRepository.search(SearchCollection.ASSETS, query, {
        userId: authUser.id,
        ...dto,
      })) as any,
      albums: (await this.searchRepository.search(SearchCollection.ALBUMS, query, {
        userId: authUser.id,
        ...dto,
      })) as any,
    };
  }

  async handleIndexAssets() {
    if (!this.enabled) {
      return;
    }

    try {
      this.logger.debug(`Running indexAssets`);
      // TODO: do this in batches based on searchIndexVersion
      const assets = await this.assetRepository.getAll({ isVisible: true });

      this.logger.log(`Indexing ${assets.length} assets`);
      await this.searchRepository.import(SearchCollection.ASSETS, assets, true);
      this.logger.debug('Finished re-indexing all assets');
    } catch (error: any) {
      this.logger.error(`Unable to index all assets`, error?.stack);
    }
  }

  async handleIndexAsset(data: IAssetJob) {
    if (!this.enabled) {
      return;
    }

    const { asset } = data;
    if (!asset.isVisible) {
      return;
    }

    try {
      await this.searchRepository.index(SearchCollection.ASSETS, asset);
    } catch (error: any) {
      this.logger.error(`Unable to index asset: ${asset.id}`, error?.stack);
    }
  }

  async handleIndexAlbums() {
    if (!this.enabled) {
      return;
    }

    try {
      const albums = await this.albumRepository.getAll();
      this.logger.log(`Indexing ${albums.length} albums`);
      await this.searchRepository.import(SearchCollection.ALBUMS, albums, true);
      this.logger.debug('Finished re-indexing all albums');
    } catch (error: any) {
      this.logger.error(`Unable to index all albums`, error?.stack);
    }
  }

  async handleIndexAlbum(data: IAlbumJob) {
    if (!this.enabled) {
      return;
    }

    const { album } = data;

    try {
      await this.searchRepository.index(SearchCollection.ALBUMS, album);
    } catch (error: any) {
      this.logger.error(`Unable to index album: ${album.id}`, error?.stack);
    }
  }

  async handleRemoveAlbum(data: IDeleteJob) {
    await this.handleRemove(SearchCollection.ALBUMS, data);
  }

  async handleRemoveAsset(data: IDeleteJob) {
    await this.handleRemove(SearchCollection.ASSETS, data);
  }

  private async handleRemove(collection: SearchCollection, data: IDeleteJob) {
    if (!this.enabled) {
      return;
    }

    const { id } = data;

    try {
      await this.searchRepository.delete(collection, id);
    } catch (error: any) {
      this.logger.error(`Unable to remove ${collection}: ${id}`, error?.stack);
    }
  }

  private assertEnabled() {
    if (!this.enabled) {
      throw new BadRequestException('Search is disabled');
    }
  }
}
