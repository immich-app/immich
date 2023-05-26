import { AlbumEntity, AssetEntity, AssetFaceEntity } from '@app/infra/entities';
import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mapAlbum } from '../album';
import { IAlbumRepository } from '../album/album.repository';
import { AssetResponseDto, mapAsset } from '../asset';
import { IAssetRepository } from '../asset/asset.repository';
import { AuthUserDto } from '../auth';
import { MACHINE_LEARNING_ENABLED } from '../domain.constant';
import { usePagination } from '../domain.util';
import { AssetFaceId, IFaceRepository } from '../facial-recognition';
import { IAssetFaceJob, IBulkEntityJob, IJobRepository, JobName, JOBS_ASSET_PAGINATION_SIZE } from '../job';
import { IMachineLearningRepository } from '../smart-info';
import { SearchDto } from './dto';
import { SearchConfigResponseDto, SearchResponseDto } from './response-dto';
import {
  ISearchRepository,
  OwnedFaceEntity,
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

  private faceQueue: SyncQueue = {
    upsert: new Set(),
    delete: new Set(),
  };

  constructor(
    @Inject(IAlbumRepository) private albumRepository: IAlbumRepository,
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(IFaceRepository) private faceRepository: IFaceRepository,
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
    if (migrationStatus[SearchCollection.FACES]) {
      this.logger.debug('Queueing job to re-index all faces');
      await this.jobRepository.queue({ name: JobName.SEARCH_INDEX_FACES });
    }
  }

  async getExploreData(authUser: AuthUserDto): Promise<SearchExploreItem<AssetResponseDto>[]> {
    this.assertEnabled();
    const results = await this.searchRepository.explore(authUser.id);
    return results.map(({ fieldName, items }) => ({
      fieldName,
      items: items.map(({ value, data }) => ({ value, data: mapAsset(data) })),
    }));
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
      return false;
    }

    const albums = this.patchAlbums(await this.albumRepository.getAll());
    this.logger.log(`Indexing ${albums.length} albums`);
    await this.searchRepository.importAlbums(albums, true);

    return true;
  }

  async handleIndexAssets() {
    if (!this.enabled) {
      return false;
    }

    // TODO: do this in batches based on searchIndexVersion
    const assetPagination = usePagination(JOBS_ASSET_PAGINATION_SIZE, (pagination) =>
      this.assetRepository.getAll(pagination, { isVisible: true }),
    );

    for await (const assets of assetPagination) {
      this.logger.debug(`Indexing ${assets.length} assets`);

      const patchedAssets = this.patchAssets(assets);
      await this.searchRepository.importAssets(patchedAssets, false);
    }

    await this.searchRepository.importAssets([], true);

    this.logger.debug('Finished re-indexing all assets');

    return false;
  }

  async handleIndexFaces() {
    if (!this.enabled) {
      return false;
    }

    // TODO: do this in batches based on searchIndexVersion
    const faces = this.patchFaces(await this.faceRepository.getAll());
    this.logger.log(`Indexing ${faces.length} faces`);

    const chunkSize = 1000;
    for (let i = 0; i < faces.length; i += chunkSize) {
      await this.searchRepository.importFaces(faces.slice(i, i + chunkSize), false);
    }

    await this.searchRepository.importFaces([], true);

    this.logger.debug('Finished re-indexing all faces');

    return true;
  }

  handleIndexAlbum({ ids }: IBulkEntityJob) {
    if (!this.enabled) {
      return false;
    }

    for (const id of ids) {
      this.albumQueue.upsert.add(id);
    }

    return true;
  }

  handleIndexAsset({ ids }: IBulkEntityJob) {
    if (!this.enabled) {
      return false;
    }

    for (const id of ids) {
      this.assetQueue.upsert.add(id);
    }

    return true;
  }

  async handleIndexFace({ assetId, personId }: IAssetFaceJob) {
    if (!this.enabled) {
      return false;
    }

    // immediately push to typesense
    await this.searchRepository.importFaces(await this.idsToFaces([{ assetId, personId }]), false);

    return true;
  }

  handleRemoveAlbum({ ids }: IBulkEntityJob) {
    if (!this.enabled) {
      return false;
    }

    for (const id of ids) {
      this.albumQueue.delete.add(id);
    }

    return true;
  }

  handleRemoveAsset({ ids }: IBulkEntityJob) {
    if (!this.enabled) {
      return false;
    }

    for (const id of ids) {
      this.assetQueue.delete.add(id);
    }

    return true;
  }

  handleRemoveFace({ assetId, personId }: IAssetFaceJob) {
    if (!this.enabled) {
      return false;
    }

    this.faceQueue.delete.add(this.asKey({ assetId, personId }));

    return true;
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

    if (this.faceQueue.upsert.size > 0) {
      const ids = [...this.faceQueue.upsert.keys()].map((key) => this.asParts(key));
      const items = await this.idsToFaces(ids);
      this.logger.debug(`Flushing ${items.length} face upserts`);
      await this.searchRepository.importFaces(items, false);
      this.faceQueue.upsert.clear();
    }

    if (this.faceQueue.delete.size > 0) {
      const ids = [...this.faceQueue.delete.keys()];
      this.logger.debug(`Flushing ${ids.length} face deletes`);
      await this.searchRepository.deleteFaces(ids);
      this.faceQueue.delete.clear();
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

  private async idsToFaces(ids: AssetFaceId[]): Promise<OwnedFaceEntity[]> {
    return this.patchFaces(await this.faceRepository.getByIds(ids));
  }

  private patchAssets(assets: AssetEntity[]): AssetEntity[] {
    return assets;
  }

  private patchAlbums(albums: AlbumEntity[]): AlbumEntity[] {
    return albums.map((entity) => ({ ...entity, assets: [] }));
  }

  private patchFaces(faces: AssetFaceEntity[]): OwnedFaceEntity[] {
    return faces.map((face) => ({
      id: this.asKey(face),
      ownerId: face.asset.ownerId,
      assetId: face.assetId,
      personId: face.personId,
      embedding: face.embedding,
    }));
  }

  private asKey(face: AssetFaceId): string {
    return `${face.assetId}|${face.personId}`;
  }

  private asParts(key: string): AssetFaceId {
    const [assetId, personId] = key.split('|');
    return { assetId, personId };
  }
}
