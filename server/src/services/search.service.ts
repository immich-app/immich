import { BadRequestException, Injectable } from '@nestjs/common';
import { LRUMap } from 'mnemonist';
import { AssetMapOptions, AssetResponseDto, MapAsset, mapAsset } from 'src/dtos/asset-response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { mapPerson, PersonResponseDto } from 'src/dtos/person.dto';
import {
  FilterSuggestionsRequestDto,
  FilterSuggestionsResponseDto,
  LargeAssetSearchDto,
  mapPlaces,
  MetadataSearchDto,
  PlacesResponseDto,
  RandomSearchDto,
  SearchPeopleDto,
  SearchPlacesDto,
  SearchResponseDto,
  SearchStatisticsResponseDto,
  SearchSuggestionRequestDto,
  SearchSuggestionType,
  SmartSearchDto,
  SmartSearchFacetsDto,
  SmartSearchFacetsResponseDto,
  StatisticsSearchDto,
  TagSuggestionRequestDto,
  TagSuggestionResponseDto,
} from 'src/dtos/search.dto';
import { AssetOrder, AssetVisibility, Permission } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { requireElevatedPermission } from 'src/utils/access';
import { getMyPartnerIds } from 'src/utils/asset.util';
import { isSmartSearchEnabled } from 'src/utils/misc';

// Opt-in env flag for per-phase smart-search timing logs. Set
// GALLERY_SEARCH_TIMING=true to emit one `log`-level line per smart search
// breaking down setup / embedding / spaces / db duration. Captured once at
// module load so toggling requires a server restart (keeps the hot path free
// of env reads).
const searchTimingEnabled = process.env.GALLERY_SEARCH_TIMING === 'true';

type ResolvedSmartSearch = {
  options: Omit<SmartSearchDto, 'page' | 'size' | 'order'> & {
    embedding: string;
    userIds: string[];
    timelineSpaceIds?: string[];
    maxDistance?: number;
    orderDirection?: SmartSearchDto['order'];
  };
  embeddingSource: 'cache' | 'ml' | 'asset';
  encodeMs: number;
  timelineSpaceCount: number;
};

@Injectable()
export class SearchService extends BaseService {
  private embeddingCache = new LRUMap<string, string>(100);

  async searchPerson(auth: AuthDto, dto: SearchPeopleDto): Promise<PersonResponseDto[]> {
    const people = await this.personRepository.getByName(auth.user.id, dto.name, { withHidden: dto.withHidden });
    return people.map((person) => mapPerson(person));
  }

  async searchPlaces(dto: SearchPlacesDto): Promise<PlacesResponseDto[]> {
    const places = await this.searchRepository.searchPlaces(dto.name);
    return places.map((place) => mapPlaces(place));
  }

  async getExploreData(auth: AuthDto) {
    const options = { maxFields: 12, minAssetsPerField: 5 };
    const cities = await this.assetRepository.getAssetIdByCity(auth.user.id, options);
    const assets = await this.assetRepository.getByIdsWithAllRelationsButStacks(cities.items.map(({ data }) => data));
    const items = assets.map((asset) => ({ value: asset.exifInfo!.city!, data: mapAsset(asset, { auth }) }));
    return [{ fieldName: cities.fieldName, items }];
  }

  async searchMetadata(auth: AuthDto, dto: MetadataSearchDto): Promise<SearchResponseDto> {
    if (dto.visibility === AssetVisibility.Locked) {
      requireElevatedPermission(auth);
    }

    if (dto.spaceId) {
      await this.requireAccess({ auth, permission: Permission.SharedSpaceRead, ids: [dto.spaceId] });
    }

    let checksum: Buffer | undefined;
    if (dto.checksum) {
      const encoding = dto.checksum.length === 28 ? 'base64' : 'hex';
      checksum = Buffer.from(dto.checksum, encoding);
    }

    const page = dto.page ?? 1;
    const size = dto.size || 250;
    const userIds = await this.getUserIdsToSearch(auth);
    const { hasNextPage, items } = await this.searchRepository.searchMetadata(
      { page, size },
      {
        ...dto,
        checksum,
        userIds,
        orderDirection: dto.order ?? AssetOrder.Desc,
      },
    );

    return this.mapResponse(items, hasNextPage ? (page + 1).toString() : null, { auth });
  }

  async searchStatistics(auth: AuthDto, dto: StatisticsSearchDto): Promise<SearchStatisticsResponseDto> {
    const userIds = await this.getUserIdsToSearch(auth);

    return await this.searchRepository.searchStatistics({
      ...dto,
      userIds,
    });
  }

  async searchRandom(auth: AuthDto, dto: RandomSearchDto): Promise<AssetResponseDto[]> {
    if (dto.visibility === AssetVisibility.Locked) {
      requireElevatedPermission(auth);
    }

    if (dto.spaceId) {
      await this.requireAccess({ auth, permission: Permission.SharedSpaceRead, ids: [dto.spaceId] });
    }

    const userIds = await this.getUserIdsToSearch(auth);
    const items = await this.searchRepository.searchRandom(dto.size || 250, { ...dto, userIds });
    return items.map((item) => mapAsset(item, { auth }));
  }

  async searchLargeAssets(auth: AuthDto, dto: LargeAssetSearchDto): Promise<AssetResponseDto[]> {
    if (dto.visibility === AssetVisibility.Locked) {
      requireElevatedPermission(auth);
    }

    if (dto.spaceId) {
      await this.requireAccess({ auth, permission: Permission.SharedSpaceRead, ids: [dto.spaceId] });
    }

    const userIds = await this.getUserIdsToSearch(auth);
    const items = await this.searchRepository.searchLargeAssets(dto.size || 250, { ...dto, userIds });
    return items.map((item) => mapAsset(item, { auth }));
  }

  async searchSmart(auth: AuthDto, dto: SmartSearchDto): Promise<SearchResponseDto> {
    const t0 = performance.now();
    const { options, embeddingSource, encodeMs, timelineSpaceCount } = await this.resolveSmartSearch(auth, dto, {
      includeOrder: true,
    });
    const tResolved = performance.now();
    const page = dto.page ?? 1;
    const size = dto.size || 100;

    const { hasNextPage, items } = await this.searchRepository.searchSmart({ page, size }, options);
    const tDb = performance.now();

    if (searchTimingEnabled) {
      this.logger.log(
        `searchSmart total=${(tDb - t0).toFixed(0)}ms ` +
          `resolve=${(tResolved - t0).toFixed(0)}ms(src=${embeddingSource}${
            embeddingSource === 'ml' ? `,encode=${encodeMs.toFixed(0)}ms` : ''
          },spaces=${timelineSpaceCount}) ` +
          `db=${(tDb - tResolved).toFixed(0)}ms(rows=${items.length}) ` +
          `query="${dto.query?.slice(0, 60) ?? ''}" size=${size}`,
      );
    }

    return this.mapResponse(items, hasNextPage ? (page + 1).toString() : null, { auth });
  }

  async searchSmartFacets(auth: AuthDto, dto: SmartSearchFacetsDto): Promise<SmartSearchFacetsResponseDto> {
    const t0 = performance.now();
    const { options, embeddingSource, encodeMs, timelineSpaceCount } = await this.resolveSmartSearch(auth, dto, {
      includeOrder: false,
    });
    const tResolved = performance.now();

    const result = await this.searchRepository.getSmartSearchFacets(options);
    const tDb = performance.now();

    if (searchTimingEnabled) {
      this.logger.log(
        `searchSmartFacets total=${(tDb - t0).toFixed(0)}ms ` +
          `resolve=${(tResolved - t0).toFixed(0)}ms(src=${embeddingSource}${
            embeddingSource === 'ml' ? `,encode=${encodeMs.toFixed(0)}ms` : ''
          }) ` +
          `spaces=${timelineSpaceCount} ` +
          `db=${(tDb - tResolved).toFixed(0)}ms(total=${result.total}) ` +
          `query="${dto.query?.slice(0, 60) ?? ''}"`,
      );
    }

    return { ...result, people: result.people.toSorted((a, b) => a.name.localeCompare(b.name)) };
  }

  async getAssetsByCity(auth: AuthDto): Promise<AssetResponseDto[]> {
    const userIds = await this.getUserIdsToSearch(auth);
    const assets = await this.searchRepository.getAssetsByCity(userIds);
    return assets.map((asset) => mapAsset(asset));
  }

  async getSearchSuggestions(auth: AuthDto, dto: SearchSuggestionRequestDto) {
    if (dto.albumId && dto.spaceId) {
      throw new BadRequestException('Cannot use albumId with spaceId');
    }

    if (dto.albumId && dto.withSharedSpaces) {
      throw new BadRequestException('Cannot use albumId with withSharedSpaces');
    }

    if (dto.spaceId && dto.withSharedSpaces) {
      throw new BadRequestException('Cannot use both spaceId and withSharedSpaces');
    }

    if (dto.albumId) {
      await this.requireAccess({ auth, permission: Permission.AlbumRead, ids: [dto.albumId] });
    } else if (dto.spaceId) {
      await this.requireAccess({ auth, permission: Permission.SharedSpaceRead, ids: [dto.spaceId] });
    }

    const userIds = await this.getUserIdsToSearch(auth);

    let timelineSpaceIds: string[] | undefined;
    if (!dto.albumId && dto.withSharedSpaces) {
      const spaceRows = await this.sharedSpaceRepository.getSpaceIdsForTimeline(auth.user.id);
      if (spaceRows.length > 0) {
        timelineSpaceIds = spaceRows.map((row) => row.spaceId);
      }
    }

    const suggestions = await this.getSuggestions(userIds, { ...dto, timelineSpaceIds });
    if (dto.includeNull) {
      suggestions.push(null);
    }
    return suggestions;
  }

  async getTagSuggestions(auth: AuthDto, dto: TagSuggestionRequestDto): Promise<TagSuggestionResponseDto[]> {
    if (dto.spaceId && dto.withSharedSpaces) {
      throw new BadRequestException('Cannot use both spaceId and withSharedSpaces');
    }

    if (dto.spaceId) {
      await this.requireAccess({ auth, permission: Permission.SharedSpaceRead, ids: [dto.spaceId] });
    }

    const userIds = await this.getUserIdsToSearch(auth);

    let timelineSpaceIds: string[] | undefined;
    if (dto.withSharedSpaces) {
      const spaceRows = await this.sharedSpaceRepository.getSpaceIdsForTimeline(auth.user.id);
      if (spaceRows.length > 0) {
        timelineSpaceIds = spaceRows.map((row) => row.spaceId);
      }
    }

    return this.searchRepository.getAccessibleTags(userIds, { ...dto, timelineSpaceIds });
  }

  async getFilterSuggestions(auth: AuthDto, dto: FilterSuggestionsRequestDto): Promise<FilterSuggestionsResponseDto> {
    if (dto.albumId && dto.spaceId) {
      throw new BadRequestException('Cannot use albumId with spaceId');
    }

    if (dto.albumId && dto.withSharedSpaces) {
      throw new BadRequestException('Cannot use albumId with withSharedSpaces');
    }

    if (dto.spaceId && dto.withSharedSpaces) {
      throw new BadRequestException('Cannot use both spaceId and withSharedSpaces');
    }

    if (dto.albumId) {
      await this.requireAccess({ auth, permission: Permission.AlbumRead, ids: [dto.albumId] });
    } else if (dto.spaceId) {
      await this.requireAccess({ auth, permission: Permission.SharedSpaceRead, ids: [dto.spaceId] });
    }

    const userIds = await this.getUserIdsToSearch(auth);

    let timelineSpaceIds: string[] | undefined;
    if (!dto.albumId && dto.withSharedSpaces) {
      const spaceRows = await this.sharedSpaceRepository.getSpaceIdsForTimeline(auth.user.id);
      if (spaceRows.length > 0) {
        timelineSpaceIds = spaceRows.map((row) => row.spaceId);
      }
    }

    return await this.searchRepository.getFilterSuggestions(userIds, { ...dto, timelineSpaceIds });
  }

  private getSuggestions(
    userIds: string[],
    dto: SearchSuggestionRequestDto & { timelineSpaceIds?: string[] },
  ): Promise<Array<string | null>> {
    switch (dto.type) {
      case SearchSuggestionType.COUNTRY: {
        return this.searchRepository.getCountries(userIds, dto);
      }
      case SearchSuggestionType.STATE: {
        return this.searchRepository.getStates(userIds, dto);
      }
      case SearchSuggestionType.CITY: {
        return this.searchRepository.getCities(userIds, dto);
      }
      case SearchSuggestionType.CAMERA_MAKE: {
        return this.searchRepository.getCameraMakes(userIds, dto);
      }
      case SearchSuggestionType.CAMERA_MODEL: {
        return this.searchRepository.getCameraModels(userIds, dto);
      }
      case SearchSuggestionType.CAMERA_LENS_MODEL: {
        return this.searchRepository.getCameraLensModels(userIds, dto);
      }
      default: {
        return Promise.resolve([]);
      }
    }
  }

  private async resolveSmartSearch(
    auth: AuthDto,
    dto: SmartSearchDto | SmartSearchFacetsDto,
    options: { includeOrder: boolean },
  ): Promise<ResolvedSmartSearch> {
    if ('visibility' in dto && dto.visibility === AssetVisibility.Locked) {
      requireElevatedPermission(auth);
    }

    if (dto.spaceId && dto.withSharedSpaces) {
      throw new BadRequestException('Cannot use both spaceId and withSharedSpaces');
    }

    if (dto.spaceId) {
      await this.requireAccess({ auth, permission: Permission.SharedSpaceRead, ids: [dto.spaceId] });
    }

    if (dto.spacePersonIds?.length && !dto.spaceId) {
      throw new BadRequestException('spacePersonIds requires spaceId');
    }

    // Cached read — the uncached path runs class-transformer + class-validator over
    // the full nested SystemConfigDto, which is ~1-3s per call on slower CPUs and
    // dominates smart-search latency. Cache invalidates on ConfigUpdate.
    const { machineLearning } = await this.getConfig({ withCache: true });
    if (!isSmartSearchEnabled(machineLearning)) {
      throw new BadRequestException('Smart search is not enabled');
    }

    let embedding: string | undefined;
    let encodeMs = 0;
    let embeddingSource: 'cache' | 'ml' | 'asset' = 'cache';
    if (dto.query) {
      const key = machineLearning.clip.modelName + dto.query + dto.language;
      embedding = this.embeddingCache.get(key);
      if (!embedding) {
        embeddingSource = 'ml';
        const tEncodeStart = performance.now();
        embedding = await this.machineLearningRepository.encodeText(dto.query, {
          modelName: machineLearning.clip.modelName,
          language: dto.language,
        });
        encodeMs = performance.now() - tEncodeStart;
        this.embeddingCache.set(key, embedding);
      }
    } else if (dto.queryAssetId) {
      embeddingSource = 'asset';
      await this.requireAccess({ auth, permission: Permission.AssetRead, ids: [dto.queryAssetId] });
      const assetEmbedding = await this.searchRepository.getEmbedding(dto.queryAssetId);
      if (!assetEmbedding) {
        throw new BadRequestException(`Asset ${dto.queryAssetId} has no embedding`);
      }
      embedding = assetEmbedding;
    } else {
      throw new BadRequestException('Either `query` or `queryAssetId` must be set');
    }

    let timelineSpaceIds: string[] | undefined;
    if (dto.withSharedSpaces) {
      const spaceRows = await this.sharedSpaceRepository.getSpaceIdsForTimeline(auth.user.id);
      if (spaceRows.length > 0) {
        timelineSpaceIds = spaceRows.map((row) => row.spaceId);
      }
    }

    const resolvedOptions = {
      ...dto,
      timelineSpaceIds,
      userIds: await this.getUserIdsToSearch(auth),
      embedding,
      maxDistance: machineLearning.clip.maxDistance,
    };

    if (options.includeOrder) {
      Object.assign(resolvedOptions, { orderDirection: 'order' in dto ? dto.order : undefined });
    }

    return {
      options: resolvedOptions,
      embeddingSource,
      encodeMs,
      timelineSpaceCount: timelineSpaceIds?.length ?? 0,
    };
  }

  private async getUserIdsToSearch(auth: AuthDto): Promise<string[]> {
    const partnerIds = await getMyPartnerIds({
      userId: auth.user.id,
      repository: this.partnerRepository,
      timelineEnabled: true,
    });
    return [auth.user.id, ...partnerIds];
  }

  private mapResponse(assets: MapAsset[], nextPage: string | null, options: AssetMapOptions): SearchResponseDto {
    return {
      albums: { total: 0, count: 0, items: [], facets: [] },
      assets: {
        total: assets.length,
        count: assets.length,
        items: assets.map((asset) => mapAsset(asset, options)),
        facets: [],
        nextPage,
      },
    };
  }
}
