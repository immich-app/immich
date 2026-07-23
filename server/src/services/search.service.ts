import { BadRequestException, Injectable } from '@nestjs/common';
import { LRUMap } from 'mnemonist';
import { SystemConfig } from 'src/config';
import { AssetMapOptions, AssetResponseDto, MapAsset, mapAsset } from 'src/dtos/asset-response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { mapPerson, PersonResponseDto } from 'src/dtos/person.dto';
import {
  isNewShapeRequest,
  LargeAssetSearchDto,
  mapPlaces,
  MetadataSearchDto,
  PlacesResponseDto,
  RandomSearchDto,
  SearchFilter,
  SearchPeopleDto,
  SearchPlacesDto,
  SearchResponseDto,
  SearchStatisticsResponseDto,
  SearchSuggestionRequestDto,
  SearchSuggestionType,
  SmartSearchDto,
  StatisticsSearchDto,
} from 'src/dtos/search.dto';
import { AssetOrder, AssetVisibility, Permission } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { requireElevatedPermission } from 'src/utils/access';
import { getMyPartnerIds } from 'src/utils/asset.util';
import { isSmartSearchEnabled } from 'src/utils/misc';
import { decodeSearchCursor, encodeSearchCursor } from 'src/utils/search-cursor';
import {
  applyLockedVisibilityPolicy,
  collectFilterIds,
  hasTopLevelPositiveIdsConstraint,
  isLockedOnlyFilter,
} from 'src/utils/search-filter';

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
    const cityAssets = await this.assetRepository.getByIdsWithAllRelationsButStacks(
      cities.items.map(({ data }) => data),
    );
    const cityItems = cityAssets.map((asset) => ({ value: asset.exifInfo!.city!, data: mapAsset(asset, { auth }) }));

    const recents = await this.assetRepository.getRecentlyCreatedAssetIds(auth.user.id, options.maxFields);
    const recentAssets = await this.assetRepository.getByIdsWithAllRelationsButStacks(
      recents.items.map((item) => item.data),
    );
    const recentItems = recentAssets.map((asset) => ({
      value: asset.createdAt.toISOString(),
      data: mapAsset(asset, { auth }),
    }));

    return [
      { fieldName: cities.fieldName, items: cityItems },
      { fieldName: recents.fieldName, items: recentItems },
    ];
  }

  async searchMetadata(auth: AuthDto, dto: MetadataSearchDto): Promise<SearchResponseDto> {
    if (isNewShapeRequest(dto)) {
      return this.searchMetadataV3(auth, dto);
    }

    if (dto.visibility === AssetVisibility.Locked) {
      requireElevatedPermission(auth);
    }

    let checksum: Buffer | undefined;
    if (dto.checksum) {
      const encoding = dto.checksum.length === 28 ? 'base64' : 'hex';
      checksum = Buffer.from(dto.checksum, encoding);
    }

    let userIds: string[] | undefined;

    if (dto.albumIds && dto.albumIds.length > 0) {
      await this.requireAccess({ auth, ids: dto.albumIds, permission: Permission.AlbumRead });
    } else if (auth.sharedLink) {
      throw new BadRequestException('Shared link access is only allowed in combination with an albumIds filter');
    } else {
      userIds = await this.getUserIdsToSearch(auth, dto.visibility);
    }

    const page = dto.page ?? 1;
    const size = dto.size || 250;
    const { hasNextPage, items } = await this.searchRepository.searchMetadata(
      { page, size },
      {
        ...dto,
        checksum,
        visibility: dto.visibility ?? (auth.session?.hasElevatedPermission ? undefined : 'not-locked'),
        userIds,
        orderDirection: dto.order ?? AssetOrder.Desc,
      },
    );

    return this.mapResponse(items, { auth }, { nextPage: hasNextPage ? (page + 1).toString() : null });
  }

  async searchStatistics(auth: AuthDto, dto: StatisticsSearchDto): Promise<SearchStatisticsResponseDto> {
    if (isNewShapeRequest(dto)) {
      return this.searchStatisticsV3(auth, dto);
    }

    const userIds = await this.getUserIdsToSearch(auth, dto.visibility);
    if (dto.visibility === AssetVisibility.Locked) {
      requireElevatedPermission(auth);
    }

    return await this.searchRepository.searchStatistics({
      ...dto,
      visibility: dto.visibility ?? (auth.session?.hasElevatedPermission ? undefined : 'not-locked'),
      userIds,
    });
  }

  async searchRandom(auth: AuthDto, dto: RandomSearchDto): Promise<AssetResponseDto[]> {
    if (isNewShapeRequest(dto)) {
      return this.searchRandomV3(auth, dto);
    }

    if (dto.visibility === AssetVisibility.Locked) {
      requireElevatedPermission(auth);
    }

    const userIds = await this.getUserIdsToSearch(auth, dto.visibility);
    const items = await this.searchRepository.searchRandom(dto.size || 250, {
      ...dto,
      visibility: dto.visibility ?? (auth.session?.hasElevatedPermission ? undefined : 'not-locked'),
      userIds,
    });
    return items.map((item) => mapAsset(item, { auth }));
  }

  async searchLargeAssets(auth: AuthDto, dto: LargeAssetSearchDto): Promise<AssetResponseDto[]> {
    if (dto.visibility === AssetVisibility.Locked) {
      requireElevatedPermission(auth);
    }

    const userIds = await this.getUserIdsToSearch(auth, dto.visibility);
    const items = await this.searchRepository.searchLargeAssets(dto.size || 250, {
      ...dto,
      visibility: dto.visibility ?? (auth.session?.hasElevatedPermission ? undefined : 'not-locked'),
      userIds,
    });
    return items.map((item) => mapAsset(item, { auth }));
  }

  async searchSmart(auth: AuthDto, dto: SmartSearchDto): Promise<SearchResponseDto> {
    if (isNewShapeRequest(dto)) {
      return this.searchSmartV3(auth, dto);
    }

    if (dto.visibility === AssetVisibility.Locked) {
      requireElevatedPermission(auth);
    }

    const { machineLearning } = await this.getConfig({ withCache: false });
    if (!isSmartSearchEnabled(machineLearning)) {
      throw new BadRequestException('Smart search is not enabled');
    }

    const userIds = this.getUserIdsToSearch(auth, dto.visibility);
    const embedding = await this.resolveEmbedding(auth, dto, machineLearning);
    const page = dto.page ?? 1;
    const size = dto.size || 100;
    const { hasNextPage, items } = await this.searchRepository.searchSmart(
      { page, size },
      {
        ...dto,
        userIds: await userIds,
        embedding,
        visibility: dto.visibility ?? (auth.session?.hasElevatedPermission ? undefined : 'not-locked'),
      },
    );

    return this.mapResponse(items, { auth }, { nextPage: hasNextPage ? (page + 1).toString() : null });
  }

  async getAssetsByCity(auth: AuthDto): Promise<AssetResponseDto[]> {
    const userIds = await this.getUserIdsToSearch(auth);
    const assets = await this.searchRepository.getAssetsByCity(userIds);
    return assets.map((asset) => mapAsset(asset));
  }

  async getSearchSuggestions(auth: AuthDto, dto: SearchSuggestionRequestDto) {
    const userIds = await this.getUserIdsToSearch(auth);
    const suggestions = await this.getSuggestions(userIds, dto);
    if (dto.includeNull) {
      suggestions.push(null);
    }
    return suggestions;
  }

  private getSuggestions(userIds: string[], dto: SearchSuggestionRequestDto): Promise<Array<string | null>> {
    switch (dto.type) {
      case SearchSuggestionType.COUNTRY: {
        return this.searchRepository.getCountries(userIds);
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

  private async searchMetadataV3(auth: AuthDto, dto: MetadataSearchDto): Promise<SearchResponseDto> {
    const filter = dto.filter ?? {};
    const effectiveFilter = applyLockedVisibilityPolicy(auth, filter);

    // only a top-level any/all constrains every result to accessible albums; anything else keeps
    // the ownership scope so an OR branch cannot widen the search to other users' assets
    const hasTopLevelAlbums = hasTopLevelPositiveIdsConstraint(filter, 'albumIds');
    if (auth.sharedLink && !hasTopLevelAlbums) {
      throw new BadRequestException('Shared link access is only allowed in combination with an albumIds filter');
    }

    const albumIds = collectFilterIds(filter, 'albumIds');
    const [userIds] = await Promise.all([
      hasTopLevelAlbums ? undefined : this.getUserIdsToSearchV3(auth, filter),
      albumIds.length > 0 ? this.requireAccess({ auth, ids: albumIds, permission: Permission.AlbumRead }) : undefined,
    ]);

    const { offset } = decodeSearchCursor(dto.cursor);
    const size = dto.size || 250;
    const { hasNextPage, items } = await this.searchRepository.searchMetadataV3(
      { size, offset },
      {
        filter: effectiveFilter,
        userIds,
        withExif: dto.withExif,
        withPeople: dto.withPeople,
        withStacked: dto.withStacked,
        order: dto.orderBy,
      },
    );

    return this.mapResponse(items, { auth }, { nextCursor: hasNextPage ? encodeSearchCursor(offset + size) : null });
  }

  private async searchStatisticsV3(auth: AuthDto, dto: StatisticsSearchDto): Promise<SearchStatisticsResponseDto> {
    const { effectiveFilter, userIds } = await this.resolveSearchScopeV3(auth, dto);
    return this.searchRepository.searchStatisticsV3({ filter: effectiveFilter, userIds });
  }

  private async searchRandomV3(auth: AuthDto, dto: RandomSearchDto): Promise<AssetResponseDto[]> {
    const { effectiveFilter, userIds } = await this.resolveSearchScopeV3(auth, dto);
    const items = await this.searchRepository.searchRandomV3(dto.size || 250, {
      filter: effectiveFilter,
      userIds,
      withExif: dto.withExif,
      withPeople: dto.withPeople,
      withStacked: dto.withStacked,
    });
    return items.map((item) => mapAsset(item, { auth }));
  }

  private async searchSmartV3(auth: AuthDto, dto: SmartSearchDto): Promise<SearchResponseDto> {
    const { machineLearning } = await this.getConfig({ withCache: false });
    if (!isSmartSearchEnabled(machineLearning)) {
      throw new BadRequestException('Smart search is not enabled');
    }

    const [{ effectiveFilter, userIds }, embedding] = await Promise.all([
      this.resolveSearchScopeV3(auth, dto),
      this.resolveEmbedding(auth, dto, machineLearning),
    ]);

    const { offset } = decodeSearchCursor(dto.cursor);
    const size = dto.size || 100;
    const { hasNextPage, items } = await this.searchRepository.searchSmartV3(
      { size, offset },
      { filter: effectiveFilter, userIds, withExif: dto.withExif, embedding },
    );

    return this.mapResponse(items, { auth }, { nextCursor: hasNextPage ? encodeSearchCursor(offset + size) : null });
  }

  private async resolveSearchScopeV3(auth: AuthDto, dto: { filter?: SearchFilter }) {
    const filter = dto.filter ?? {};
    return {
      effectiveFilter: applyLockedVisibilityPolicy(auth, filter),
      userIds: await this.getUserIdsToSearchV3(auth, filter),
    };
  }

  private getUserIdsToSearchV3(auth: AuthDto, filter: SearchFilter): Promise<string[]> {
    return this.getUserIdsToSearch(auth, isLockedOnlyFilter(filter) ? AssetVisibility.Locked : undefined);
  }

  private async resolveEmbedding(
    auth: AuthDto,
    dto: SmartSearchDto,
    machineLearning: SystemConfig['machineLearning'],
  ): Promise<string> {
    if (dto.query) {
      const key = machineLearning.clip.modelName + dto.query + dto.language;
      let embedding = this.embeddingCache.get(key);
      if (!embedding) {
        embedding = await this.machineLearningRepository.encodeText(dto.query, {
          modelName: machineLearning.clip.modelName,
          language: dto.language,
        });
        this.embeddingCache.set(key, embedding);
      }
      return embedding;
    }

    if (dto.queryAssetId) {
      await this.requireAccess({ auth, permission: Permission.AssetRead, ids: [dto.queryAssetId] });
      const getEmbeddingResponse = await this.searchRepository.getEmbedding(dto.queryAssetId);
      const assetEmbedding = getEmbeddingResponse?.embedding;
      if (!assetEmbedding) {
        throw new BadRequestException(`Asset ${dto.queryAssetId} has no embedding`);
      }
      return assetEmbedding;
    }

    throw new BadRequestException('Either `query` or `queryAssetId` must be set');
  }

  private async getUserIdsToSearch(auth: AuthDto, visibility?: AssetVisibility): Promise<string[]> {
    // Locked assets are personal. Never include partner IDs, regardless of A's elevated session.
    if (visibility === AssetVisibility.Locked) {
      return [auth.user.id];
    }
    const partnerIds = await getMyPartnerIds({
      userId: auth.user.id,
      repository: this.partnerRepository,
      timelineEnabled: true,
    });
    return [auth.user.id, ...partnerIds];
  }

  private mapResponse(
    assets: MapAsset[],
    options: AssetMapOptions,
    page: { nextPage?: string | null; nextCursor?: string | null } = {},
  ): SearchResponseDto {
    return {
      albums: { total: 0, count: 0, items: [], facets: [] },
      assets: {
        total: assets.length,
        count: assets.length,
        items: assets.map((asset) => mapAsset(asset, options)),
        facets: [],
        nextPage: page.nextPage ?? null,
        nextCursor: page.nextCursor ?? null,
      },
    };
  }
}
