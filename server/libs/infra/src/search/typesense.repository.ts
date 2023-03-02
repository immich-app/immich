import {
  ISearchRepository,
  SearchCollection,
  SearchCollectionIndexStatus,
  SearchFilter,
  SearchResult,
} from '@app/domain';
import { Injectable, Logger } from '@nestjs/common';
import _, { Dictionary } from 'lodash';
import { Client } from 'typesense';
import { CollectionCreateSchema } from 'typesense/lib/Typesense/Collections';
import { DocumentSchema, SearchResponse } from 'typesense/lib/Typesense/Documents';
import { AlbumEntity, AssetEntity } from '../db';
import { albumSchema } from './schemas/album.schema';
import { assetSchema } from './schemas/asset.schema';

interface GeoAssetEntity extends AssetEntity {
  geo?: [number, number];
}

function removeNil<T extends Dictionary<any>>(item: T): Partial<T> {
  _.forOwn(item, (value, key) => {
    if (_.isNil(value) || (_.isObject(value) && !_.isDate(value) && _.isEmpty(removeNil(value)))) {
      delete item[key];
    }
  });

  return item;
}

const schemaMap: Record<SearchCollection, CollectionCreateSchema> = {
  [SearchCollection.ASSETS]: assetSchema,
  [SearchCollection.ALBUMS]: albumSchema,
};

const schemas = Object.entries(schemaMap) as [SearchCollection, CollectionCreateSchema][];

interface SearchUpdateQueue<T = any> {
  upsert: T[];
  delete: string[];
}

@Injectable()
export class TypesenseRepository implements ISearchRepository {
  private logger = new Logger(TypesenseRepository.name);
  private queue: Record<SearchCollection, SearchUpdateQueue> = {
    [SearchCollection.ASSETS]: {
      upsert: [],
      delete: [],
    },
    [SearchCollection.ALBUMS]: {
      upsert: [],
      delete: [],
    },
  };

  private _client: Client | null = null;
  private get client(): Client {
    if (!this._client) {
      throw new Error('Typesense client not available (no apiKey was provided)');
    }
    return this._client;
  }

  constructor() {
    const apiKey = process.env.TYPESENSE_API_KEY;
    if (!apiKey) {
      return;
    }

    this._client = new Client({
      nodes: [
        {
          host: process.env.TYPESENSE_HOST || 'typesense',
          port: Number(process.env.TYPESENSE_PORT) || 8108,
          protocol: process.env.TYPESENSE_PROTOCOL || 'http',
        },
      ],
      apiKey,
      numRetries: 3,
      connectionTimeoutSeconds: 10,
    });

    setInterval(() => this.flush(), 5_000);
  }

  async setup(): Promise<void> {
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

  async index(collection: SearchCollection, item: AssetEntity | AlbumEntity, immediate?: boolean): Promise<void> {
    const schema = schemaMap[collection];

    if (collection === SearchCollection.ASSETS) {
      item = this.patchAsset(item as AssetEntity);
    }

    if (immediate) {
      await this.client.collections(schema.name).documents().upsert(item);
      return;
    }

    this.queue[collection].upsert.push(item);
  }

  async delete(collection: SearchCollection, id: string, immediate?: boolean): Promise<void> {
    const schema = schemaMap[collection];

    if (immediate) {
      await this.client.collections(schema.name).documents().delete(id);
      return;
    }

    this.queue[collection].delete.push(id);
  }

  async import(collection: SearchCollection, items: AssetEntity[] | AlbumEntity[], done: boolean): Promise<void> {
    try {
      const schema = schemaMap[collection];
      const _items = items.map((item) => {
        if (collection === SearchCollection.ASSETS) {
          item = this.patchAsset(item as AssetEntity);
        }
        // null values are invalid for typesense documents
        return removeNil(item);
      });
      if (_items.length > 0) {
        await this.client
          .collections(schema.name)
          .documents()
          .import(_items, { action: 'upsert', dirty_values: 'coerce_or_drop' });
      }
      if (done) {
        await this.updateAlias(collection);
      }
    } catch (error: any) {
      this.handleError(error);
    }
  }

  search(collection: SearchCollection.ASSETS, query: string, filter: SearchFilter): Promise<SearchResult<AssetEntity>>;
  search(collection: SearchCollection.ALBUMS, query: string, filter: SearchFilter): Promise<SearchResult<AlbumEntity>>;
  async search(collection: SearchCollection, query: string, filters: SearchFilter) {
    const alias = await this.client.aliases(collection).retrieve();

    const { userId } = filters;

    const _filters = [`ownerId:${userId}`];

    if (filters.id) {
      _filters.push(`id:=${filters.id}`);
    }
    if (collection === SearchCollection.ASSETS) {
      for (const item of schemaMap[collection].fields || []) {
        let value = filters[item.name as keyof SearchFilter];
        if (Array.isArray(value)) {
          value = `[${value.join(',')}]`;
        }
        if (item.facet && value !== undefined) {
          _filters.push(`${item.name}:${value}`);
        }
      }

      this.logger.debug(`Searching query='${query}', filters='${JSON.stringify(_filters)}'`);

      const results = await this.client
        .collections<AssetEntity>(alias.collection_name)
        .documents()
        .search({
          q: query,
          query_by: [
            'exifInfo.imageName',
            'exifInfo.country',
            'exifInfo.state',
            'exifInfo.city',
            'exifInfo.description',
            'smartInfo.tags',
            'smartInfo.objects',
          ].join(','),
          filter_by: _filters.join(' && '),
          per_page: 250,
          facet_by: (assetSchema.fields || [])
            .filter((field) => field.facet)
            .map((field) => field.name)
            .join(','),
        });

      return this.asResponse(results);
    }

    if (collection === SearchCollection.ALBUMS) {
      const results = await this.client
        .collections<AlbumEntity>(alias.collection_name)
        .documents()
        .search({
          q: query,
          query_by: 'albumName',
          filter_by: _filters.join(','),
        });

      return this.asResponse(results);
    }

    throw new Error(`Invalid collection: ${collection}`);
  }

  private asResponse<T extends DocumentSchema>(results: SearchResponse<T>): SearchResult<T> {
    return {
      page: results.page,
      total: results.found,
      count: results.out_of,
      items: (results.hits || []).map((hit) => hit.document),
      facets: (results.facet_counts || []).map((facet) => ({
        counts: facet.counts.map((item) => ({ count: item.count, value: item.value })),
        fieldName: facet.field_name as string,
      })),
    };
  }

  private async flush() {
    for (const [collection, schema] of schemas) {
      if (this.queue[collection].upsert.length > 0) {
        try {
          const items = this.queue[collection].upsert.map((item) => removeNil(item));
          this.logger.debug(`Flushing ${items.length} ${collection} upserts to typesense`);
          await this.client
            .collections(schema.name)
            .documents()
            .import(items, { action: 'upsert', dirty_values: 'coerce_or_drop' });
          this.queue[collection].upsert = [];
        } catch (error) {
          this.handleError(error);
        }
      }

      if (this.queue[collection].delete.length > 0) {
        try {
          const items = this.queue[collection].delete;
          this.logger.debug(`Flushing ${items.length} ${collection} deletes to typesense`);
          await this.client
            .collections(schema.name)
            .documents()
            .delete({ filter_by: `id: [${items.join(',')}]` });
          this.queue[collection].delete = [];
        } catch (error) {
          this.handleError(error);
        }
      }
    }
  }

  private handleError(error: any): never {
    this.logger.error('Unable to index documents');
    const results = error.importResults || [];
    for (const result of results) {
      try {
        result.document = JSON.parse(result.document);
      } catch {}
    }
    this.logger.verbose(JSON.stringify(results, null, 2));
    throw error;
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

  private patchAsset(asset: AssetEntity): GeoAssetEntity {
    const lat = asset.exifInfo?.latitude;
    const lng = asset.exifInfo?.longitude;
    if (lat && lng && lat !== 0 && lng !== 0) {
      return { ...asset, geo: [lat, lng] };
    }

    return asset;
  }
}
