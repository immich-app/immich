import { AlbumEntity, AssetEntity } from '@app/infra/entities';
import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mapAlbum } from '../album';
import { IAlbumRepository } from '../album/album.repository';
import { mapAsset } from '../asset';
import { IAssetRepository } from '../asset/asset.repository';
import { AuthUserDto } from '../auth';
import { MACHINE_LEARNING_ENABLED } from '../domain.constant';
import { IBulkEntityJob, IJobRepository, JobName } from '../job';
import { IMachineLearningRepository } from '../smart-info';
import { SearchDto } from './dto';
import { SearchConfigResponseDto, SearchResponseDto } from './response-dto';
import {
  ISearchRepository,
  SearchCollection,
  SearchExploreItem,
  SearchResult,
  SearchStrategy,
} from './search.repository';

interface SyncQueue {
  upsert: Set<string>;
  delete: Set<string>;
}

@Injectable()
export class SearchService {
  private logger = new Logger(SearchService.name);
  private enabled: boolean;
  private timer: NodeJS.Timer | null = null;

  private albumQueue: SyncQueue = {
    upsert: new Set(),
    delete: new Set(),
  };

  private assetQueue: SyncQueue = {
    upsert: new Set(),
    delete: new Set(),
  };

  constructor(
    @Inject(IAlbumRepository) private albumRepository: IAlbumRepository,
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(IMachineLearningRepository) private machineLearning: IMachineLearningRepository,
    @Inject(ISearchRepository) private searchRepository: ISearchRepository,
    configService: ConfigService,
  ) {
    this.enabled = configService.get('TYPESENSE_ENABLED') !== 'false';
    if (this.enabled) {
      this.timer = setInterval(() => this.flush(), 5_000);
    }
  }

  teardown() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
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

    const query = dto.q || dto.query || '*';
    const strategy = dto.clip && MACHINE_LEARNING_ENABLED ? SearchStrategy.CLIP : SearchStrategy.TEXT;
    const filters = { userId: authUser.id, ...dto };

    let assets: SearchResult<AssetEntity>;
    switch (strategy) {
      case SearchStrategy.CLIP:
        const clip = await this.machineLearning.encodeText(query);
        assets = await this.searchRepository.vectorSearch(clip, filters);
        break;
      case SearchStrategy.TEXT:
      default:
        assets = await this.searchRepository.searchAssets(query, filters);
        break;
    }

    const albums = await this.searchRepository.searchAlbums(query, filters);

    return {
      albums: { ...albums, items: albums.items.map(mapAlbum) },
      assets: { ...assets, items: assets.items.map(mapAsset) },
    };
  }

  async handleIndexAlbums() {
    if (!this.enabled) {
      return;
    }

    try {
      const albums = this.patchAlbums(await this.albumRepository.getAll());
      this.logger.log(`Indexing ${albums.length} albums`);
      await this.searchRepository.importAlbums(albums, true);
    } catch (error: any) {
      this.logger.error(`Unable to index all albums`, error?.stack);
    }
  }

  async handleIndexAssets() {
    if (!this.enabled) {
      return;
    }

    try {
      // TODO: do this in batches based on searchIndexVersion
      const assets = this.patchAssets(await this.assetRepository.getAll({ isVisible: true }));
      this.logger.log(`Indexing ${assets.length} assets`);

      const chunkSize = 1000;
      for (let i = 0; i < assets.length; i += chunkSize) {
        await this.searchRepository.importAssets(assets.slice(i, i + chunkSize), false);
      }

      await this.searchRepository.importAssets([], true);

      this.logger.debug('Finished re-indexing all assets');
    } catch (error: any) {
      this.logger.error(`Unable to index all assets`, error?.stack);
    }
  }

  handleIndexAlbum({ ids }: IBulkEntityJob) {
    if (!this.enabled) {
      return;
    }

    for (const id of ids) {
      this.albumQueue.upsert.add(id);
    }
  }

  handleIndexAsset({ ids }: IBulkEntityJob) {
    if (!this.enabled) {
      return;
    }

    for (const id of ids) {
      this.assetQueue.upsert.add(id);
    }
  }

  handleRemoveAlbum({ ids }: IBulkEntityJob) {
    if (!this.enabled) {
      return;
    }

    for (const id of ids) {
      this.albumQueue.delete.add(id);
    }
  }

  handleRemoveAsset({ ids }: IBulkEntityJob) {
    if (!this.enabled) {
      return;
    }

    for (const id of ids) {
      this.assetQueue.delete.add(id);
    }
  }

  private async flush() {
    if (this.albumQueue.upsert.size > 0) {
      const ids = [...this.albumQueue.upsert.keys()];
      const items = await this.idsToAlbums(ids);
      this.logger.debug(`Flushing ${items.length} album upserts`);
      await this.searchRepository.importAlbums(items, false);
      this.albumQueue.upsert.clear();
    }

    if (this.albumQueue.delete.size > 0) {
      const ids = [...this.albumQueue.delete.keys()];
      this.logger.debug(`Flushing ${ids.length} album deletes`);
      await this.searchRepository.deleteAlbums(ids);
      this.albumQueue.delete.clear();
    }

    if (this.assetQueue.upsert.size > 0) {
      const ids = [...this.assetQueue.upsert.keys()];
      const items = await this.idsToAssets(ids);
      this.logger.debug(`Flushing ${items.length} asset upserts`);
      await this.searchRepository.importAssets(items, false);
      this.assetQueue.upsert.clear();
    }

    if (this.assetQueue.delete.size > 0) {
      const ids = [...this.assetQueue.delete.keys()];
      this.logger.debug(`Flushing ${ids.length} asset deletes`);
      await this.searchRepository.deleteAssets(ids);
      this.assetQueue.delete.clear();
    }
  }

  private assertEnabled() {
    if (!this.enabled) {
      throw new BadRequestException('Search is disabled');
    }
  }

  private async idsToAlbums(ids: string[]): Promise<AlbumEntity[]> {
    const entities = await this.albumRepository.getByIds(ids);
    return this.patchAlbums(entities);
  }

  private async idsToAssets(ids: string[]): Promise<AssetEntity[]> {
    const entities = await this.assetRepository.getByIds(ids);
    return this.patchAssets(entities.filter((entity) => entity.isVisible));
  }

  private patchAssets(assets: AssetEntity[]): AssetEntity[] {
    return assets;
  }

  private patchAlbums(albums: AlbumEntity[]): AlbumEntity[] {
    return albums.map((entity) => ({ ...entity, assets: [] }));
  }
}
