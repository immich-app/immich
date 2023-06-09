import {
  ISearchRepository,
  OwnedFaceEntity,
  SearchCollection,
  SearchCollectionIndexStatus,
  SearchExploreItem,
  SearchFaceFilter,
  SearchFilter,
  SearchResult,
} from '@app/domain';
import { Injectable, Logger } from '@nestjs/common';
import _, { Dictionary } from 'lodash';
import { catchError, filter, firstValueFrom, from, map, mergeMap, of, toArray } from 'rxjs';
import { Client } from 'typesense';
import { CollectionCreateSchema } from 'typesense/lib/Typesense/Collections';
import { DocumentSchema, SearchResponse } from 'typesense/lib/Typesense/Documents';
import { AlbumEntity, AssetEntity, AssetFaceEntity } from '../entities';
import { typesenseConfig } from '../infra.config';
import { albumSchema, assetSchema, faceSchema } from '../typesense-schemas';

function removeNil<T extends Dictionary<any>>(item: T): T {
  _.forOwn(item, (value, key) => {
    if (_.isNil(value) || (_.isObject(value) && !_.isDate(value) && _.isEmpty(removeNil(value)))) {
      delete item[key];
    }
  });

  return item;
}

interface MultiSearchError {
  code: number;
  error: string;
}

interface CustomAssetEntity extends AssetEntity {
  geo?: [number, number];
  motion?: boolean;
  people?: string[];
}

const schemaMap: Record<SearchCollection, CollectionCreateSchema> = {
  [SearchCollection.ASSETS]: assetSchema,
  [SearchCollection.ALBUMS]: albumSchema,
  [SearchCollection.FACES]: faceSchema,
};

const schemas = Object.entries(schemaMap) as [SearchCollection, CollectionCreateSchema][];

@Injectable()
export class TypesenseRepository implements ISearchRepository {
  private logger = new Logger(TypesenseRepository.name);

  private _client: Client | null = null;
  private get client(): Client {
    if (!this._client) {
      throw new Error('Typesense client not available (no apiKey was provided)');
    }
    return this._client;
  }

  constructor() {
    if (!typesenseConfig.apiKey) {
      return;
    }

    this._client = new Client(typesenseConfig);
  }

  async setup(): Promise<void> {
    const collections = await this.client.collections().retrieve();
    for (const collection of collections) {
      this.logger.debug(`${collection.name} collection has ${collection.num_documents} documents`);
      // await this.client.collections(collection.name).delete();
    }

    // upsert collections
    for (const [collectionName, schema] of schemas) {
      const collection = await this.client
        .collections(schema.name)
        .retrieve()
        .catch(() => null);
      if (!collection) {
        this.logger.log(`Creating schema: ${collectionName}/${schema.name}`);
        await this.client.collections().create(schema);
      } else {
        this.logger.log(`Schema up to date: ${collectionName}/${schema.name}`);
      }
    }
  }

  async checkMigrationStatus(): Promise<SearchCollectionIndexStatus> {
    const migrationMap: SearchCollectionIndexStatus = {
      [SearchCollection.ASSETS]: false,
      [SearchCollection.ALBUMS]: false,
      [SearchCollection.FACES]: false,
    };

    // check if alias is using the current schema
    const { aliases } = await this.client.aliases().retrieve();
    this.logger.log(`Alias mapping: ${JSON.stringify(aliases)}`);

    for (const [aliasName, schema] of schemas) {
      const match = aliases.find((alias) => alias.name === aliasName);
      if (!match || match.collection_name !== schema.name) {
        migrationMap[aliasName] = true;
      }
    }

    this.logger.log(`Collections needing migration: ${JSON.stringify(migrationMap)}`);

    return migrationMap;
  }

  async importAlbums(items: AlbumEntity[], done: boolean): Promise<void> {
    await this.import(SearchCollection.ALBUMS, items, done);
  }

  async importAssets(items: AssetEntity[], done: boolean): Promise<void> {
    await this.import(SearchCollection.ASSETS, items, done);
  }

  async importFaces(items: OwnedFaceEntity[], done: boolean): Promise<void> {
    await this.import(SearchCollection.FACES, items, done);
  }

  private async import(
    collection: SearchCollection,
    items: AlbumEntity[] | AssetEntity[] | OwnedFaceEntity[],
    done: boolean,
  ): Promise<void> {
    try {
      if (items.length > 0) {
        await this.client.collections(schemaMap[collection].name).documents().import(this.patch(collection, items), {
          action: 'upsert',
          dirty_values: 'coerce_or_drop',
        });
      }

      if (done) {
        await this.updateAlias(collection);
      }
    } catch (error: any) {
      this.handleError(error);
    }
  }

  async explore(userId: string): Promise<SearchExploreItem<AssetEntity>[]> {
    const common = {
      q: '*',
      filter_by: this.buildFilterBy('ownerId', userId, true),
      per_page: 100,
    };

    const asset$ = this.client.collections<AssetEntity>(assetSchema.name).documents();

    const { facet_counts: facets } = await asset$.search({
      ...common,
      query_by: 'originalFileName',
      facet_by: 'exifInfo.city,smartInfo.objects',
      max_facet_values: 12,
    });

    return firstValueFrom(
      from(facets || []).pipe(
        mergeMap(
          (facet) =>
            from(facet.counts).pipe(
              mergeMap((count) => {
                const config = {
                  ...common,
                  query_by: 'originalFileName',
                  filter_by: [
                    this.buildFilterBy('ownerId', userId, true),
                    this.buildFilterBy(facet.field_name, count.value, true),
                  ].join(' && '),
                  per_page: 1,
                };

                this.logger.verbose(`Explore subquery: "filter_by:${config.filter_by}" (count:${count.count})`);

                return from(asset$.search(config)).pipe(
                  catchError((error: any) => {
                    this.logger.warn(`Explore subquery error: ${error}`, error?.stack);
                    return of({ hits: [] });
                  }),
                  map((result) => ({
                    value: count.value,
                    data: result.hits?.[0]?.document as AssetEntity,
                  })),
                  filter((item) => !!item.data),
                );
              }, 5),
              toArray(),
              map((items) => ({
                fieldName: facet.field_name as string,
                items,
              })),
            ),
          3,
        ),
        toArray(),
      ),
    );
  }

  async deleteAlbums(ids: string[]): Promise<void> {
    await this.delete(SearchCollection.ALBUMS, ids);
  }

  async deleteAssets(ids: string[]): Promise<void> {
    await this.delete(SearchCollection.ASSETS, ids);
  }

  async deleteFaces(ids: string[]): Promise<void> {
    await this.delete(SearchCollection.FACES, ids);
  }

  async deleteAllFaces(): Promise<number> {
    const records = await this.client.collections(faceSchema.name).documents().delete({ filter_by: 'ownerId:!=null' });
    return records.num_deleted;
  }

  async delete(collection: SearchCollection, ids: string[]): Promise<void> {
    await this.client
      .collections(schemaMap[collection].name)
      .documents()
      .delete({ filter_by: this.buildFilterBy('id', ids, true) });
  }

  async searchAlbums(query: string, filters: SearchFilter): Promise<SearchResult<AlbumEntity>> {
    const results = await this.client
      .collections<AlbumEntity>(albumSchema.name)
      .documents()
      .search({
        q: query,
        query_by: 'albumName',
        filter_by: this.getAlbumFilters(filters),
      });

    return this.asResponse(results, filters.debug);
  }

  async searchAssets(query: string, filters: SearchFilter): Promise<SearchResult<AssetEntity>> {
    const results = await this.client
      .collections<AssetEntity>(assetSchema.name)
      .documents()
      .search({
        q: query,
        query_by: [
          'originalFileName',
          'exifInfo.country',
          'exifInfo.state',
          'exifInfo.city',
          'exifInfo.description',
          'smartInfo.tags',
          'smartInfo.objects',
          'people',
        ].join(','),
        per_page: 250,
        facet_by: this.getFacetFieldNames(SearchCollection.ASSETS),
        filter_by: this.getAssetFilters(filters),
        sort_by: filters.recent ? 'createdAt:desc' : undefined,
      });

    return this.asResponse(results, filters.debug);
  }

  async searchFaces(input: number[], filters: SearchFaceFilter): Promise<SearchResult<AssetFaceEntity>> {
    const { results } = await this.client.multiSearch.perform({
      searches: [
        {
          collection: faceSchema.name,
          q: '*',
          vector_query: `embedding:([${input.join(',')}], k:5)`,
          per_page: 250,
          filter_by: this.buildFilterBy('ownerId', filters.ownerId, true),
        } as any,
      ],
    });

    return this.asResponse(results[0] as SearchResponse<AssetFaceEntity>);
  }

  async vectorSearch(input: number[], filters: SearchFilter): Promise<SearchResult<AssetEntity>> {
    const { results } = await this.client.multiSearch.perform({
      searches: [
        {
          collection: assetSchema.name,
          q: '*',
          vector_query: `smartInfo.clipEmbedding:([${input.join(',')}], k:100)`,
          per_page: 250,
          facet_by: this.getFacetFieldNames(SearchCollection.ASSETS),
          filter_by: this.getAssetFilters(filters),
        } as any,
      ],
    });

    return this.asResponse(results[0] as SearchResponse<AssetEntity>, filters.debug);
  }

  private asResponse<T extends DocumentSchema>(
    resultsOrError: SearchResponse<T> | MultiSearchError,
    debug?: boolean,
  ): SearchResult<T> {
    const { error, code } = resultsOrError as MultiSearchError;
    if (error) {
      throw new Error(`Typesense multi-search error: ${code} - ${error}`);
    }

    const results = resultsOrError as SearchResponse<T>;

    return {
      page: results.page,
      total: results.found,
      count: results.out_of,
      items: (results.hits || []).map((hit) => hit.document),
      distances: (results.hits || []).map((hit: any) => hit.vector_distance),
      facets: (results.facet_counts || []).map((facet) => ({
        counts: facet.counts.map((item) => ({ count: item.count, value: item.value })),
        fieldName: facet.field_name as string,
      })),
      debug: debug ? results : undefined,
    } as SearchResult<T>;
  }

  private handleError(error: any) {
    this.logger.error('Unable to index documents');
    const results = error.importResults || [];
    for (const result of results) {
      try {
        result.document = JSON.parse(result.document);
        if (result.document?.smartInfo?.clipEmbedding) {
          result.document.smartInfo.clipEmbedding = '<truncated>';
        }
      } catch {}
    }

    this.logger.verbose(JSON.stringify(results, null, 2));
  }

  private async updateAlias(collection: SearchCollection) {
    const schema = schemaMap[collection];
    const alias = await this.client
      .aliases(collection)
      .retrieve()
      .catch(() => null);

    // update alias to current collection
    this.logger.log(`Using new schema: ${alias?.collection_name || '(unset)'} => ${schema.name}`);
    await this.client.aliases().upsert(collection, { collection_name: schema.name });

    // delete previous collection
    if (alias && alias.collection_name !== schema.name) {
      this.logger.log(`Deleting old schema: ${alias.collection_name}`);
      await this.client.collections(alias.collection_name).delete();
    }
  }

  private patch(collection: SearchCollection, items: AssetEntity[] | AlbumEntity[] | OwnedFaceEntity[]) {
    return items.map((item) => {
      switch (collection) {
        case SearchCollection.ASSETS:
          return this.patchAsset(item as AssetEntity);
        case SearchCollection.ALBUMS:
          return this.patchAlbum(item as AlbumEntity);
        case SearchCollection.FACES:
          return this.patchFace(item as OwnedFaceEntity);
      }
    });
  }

  private patchAlbum(album: AlbumEntity): AlbumEntity {
    return removeNil(album);
  }

  private patchAsset(asset: AssetEntity): CustomAssetEntity {
    let custom = asset as CustomAssetEntity;

    const lat = asset.exifInfo?.latitude;
    const lng = asset.exifInfo?.longitude;
    if (lat && lng && lat !== 0 && lng !== 0) {
      custom = { ...custom, geo: [lat, lng] };
    }

    const people = asset.faces?.map((face) => face.person.name).filter((name) => name) || [];
    if (people.length) {
      custom = { ...custom, people };
    }
    return removeNil({ ...custom, motion: !!asset.livePhotoVideoId });
  }

  private patchFace(face: OwnedFaceEntity): OwnedFaceEntity {
    return removeNil(face);
  }

  private getFacetFieldNames(collection: SearchCollection) {
    return (schemaMap[collection].fields || [])
      .filter((field) => field.facet)
      .map((field) => field.name)
      .join(',');
  }

  private getAlbumFilters(filters: SearchFilter) {
    const { userId } = filters;

    const _filters = [this.buildFilterBy('ownerId', userId, true)];

    if (filters.id) {
      _filters.push(this.buildFilterBy('id', filters.id, true));
    }

    for (const item of albumSchema.fields || []) {
      const value = filters[item.name as keyof SearchFilter];
      if (item.facet && value !== undefined) {
        _filters.push(this.buildFilterBy(item.name, value));
      }
    }

    const result = _filters.join(' && ');

    this.logger.debug(`Album filters are: ${result}`);

    return result;
  }

  private getAssetFilters(filters: SearchFilter) {
    const { userId } = filters;
    const _filters = [this.buildFilterBy('ownerId', userId, true)];

    if (filters.id) {
      _filters.push(this.buildFilterBy('id', filters.id, true));
    }

    for (const item of assetSchema.fields || []) {
      const value = filters[item.name as keyof SearchFilter];
      if (item.facet && value !== undefined) {
        _filters.push(this.buildFilterBy(item.name, value));
      }
    }

    const result = _filters.join(' && ');

    this.logger.debug(`Asset filters are: ${result}`);

    return result;
  }

  private buildFilterBy(key: string, values: boolean | string | string[], exact?: boolean) {
    const token = exact ? ':=' : ':';

    const _values = (Array.isArray(values) ? values : [values]).map((value) => {
      if (typeof value === 'boolean' || value === 'true' || value === 'false') {
        return value;
      }
      return '`' + value + '`';
    });

    const value = _values.length > 1 ? `[${_values.join(',')}]` : _values[0];

    return `${key}${token}${value}`;
  }
}
