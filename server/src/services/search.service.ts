import { BadRequestException, Injectable } from '@nestjs/common';
import { LRUMap } from 'mnemonist';
import { AssetMapOptions, AssetResponseDto, MapAsset, mapAsset } from 'src/dtos/asset-response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { mapPerson, PersonResponseDto } from 'src/dtos/person.dto';
import {
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
  StatisticsSearchDto,
} from 'src/dtos/search.dto';
import { AssetOrder, AssetVisibility, Permission } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { requireElevatedPermission } from 'src/utils/access';
import { AssetOwnerFilter, getMyPartners, PartnerDateConstraint } from 'src/utils/asset.util';
import { isSmartSearchEnabled } from 'src/utils/misc';

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

    let checksum: Buffer | undefined;
    if (dto.checksum) {
      const encoding = dto.checksum.length === 28 ? 'base64' : 'hex';
      checksum = Buffer.from(dto.checksum, encoding);
    }

    const page = dto.page ?? 1;
    const size = dto.size || 250;
    const ownerFilter = await this.getOwnerFilter(auth);
    const { hasNextPage, items } = await this.searchRepository.searchMetadata(
      { page, size },
      {
        ...dto,
        ...ownerFilter,
        checksum,
        orderDirection: dto.order ?? AssetOrder.Desc,
      },
    );

    return this.mapResponse(items, hasNextPage ? (page + 1).toString() : null, { auth });
  }

  async searchStatistics(auth: AuthDto, dto: StatisticsSearchDto): Promise<SearchStatisticsResponseDto> {
    const ownerFilter = await this.getOwnerFilter(auth);

    return await this.searchRepository.searchStatistics({
      ...dto,
      ...ownerFilter,
    });
  }

  async searchRandom(auth: AuthDto, dto: RandomSearchDto): Promise<AssetResponseDto[]> {
    if (dto.visibility === AssetVisibility.Locked) {
      requireElevatedPermission(auth);
    }

    const ownerFilter = await this.getOwnerFilter(auth);
    const items = await this.searchRepository.searchRandom(dto.size || 250, { ...dto, ...ownerFilter });
    return items.map((item) => mapAsset(item, { auth }));
  }

  async searchLargeAssets(auth: AuthDto, dto: LargeAssetSearchDto): Promise<AssetResponseDto[]> {
    if (dto.visibility === AssetVisibility.Locked) {
      requireElevatedPermission(auth);
    }

    const ownerFilter = await this.getOwnerFilter(auth);
    const items = await this.searchRepository.searchLargeAssets(dto.size || 250, { ...dto, ...ownerFilter });
    return items.map((item) => mapAsset(item, { auth }));
  }

  async searchSmart(auth: AuthDto, dto: SmartSearchDto): Promise<SearchResponseDto> {
    if (dto.visibility === AssetVisibility.Locked) {
      requireElevatedPermission(auth);
    }

    const { machineLearning } = await this.getConfig({ withCache: false });
    if (!isSmartSearchEnabled(machineLearning)) {
      throw new BadRequestException('Smart search is not enabled');
    }

    const ownerFilterPromise = this.getOwnerFilter(auth);
    let embedding;
    if (dto.query) {
      const key = machineLearning.clip.modelName + dto.query + dto.language;
      embedding = this.embeddingCache.get(key);
      if (!embedding) {
        embedding = await this.machineLearningRepository.encodeText(dto.query, {
          modelName: machineLearning.clip.modelName,
          language: dto.language,
        });
        this.embeddingCache.set(key, embedding);
      }
    } else if (dto.queryAssetId) {
      await this.requireAccess({ auth, permission: Permission.AssetRead, ids: [dto.queryAssetId] });
      const getEmbeddingResponse = await this.searchRepository.getEmbedding(dto.queryAssetId);
      const assetEmbedding = getEmbeddingResponse?.embedding;
      if (!assetEmbedding) {
        throw new BadRequestException(`Asset ${dto.queryAssetId} has no embedding`);
      }
      embedding = assetEmbedding;
    } else {
      throw new BadRequestException('Either `query` or `queryAssetId` must be set');
    }
    const page = dto.page ?? 1;
    const size = dto.size || 100;
    const ownerFilter = await ownerFilterPromise;
    const { hasNextPage, items } = await this.searchRepository.searchSmart(
      { page, size },
      { ...dto, ...ownerFilter, userIds: ownerFilter.userIds ?? [auth.user.id], embedding },
    );

    return this.mapResponse(items, hasNextPage ? (page + 1).toString() : null, { auth });
  }

  async getAssetsByCity(auth: AuthDto): Promise<AssetResponseDto[]> {
    const ownerFilter = await this.getOwnerFilter(auth);
    const assets = await this.searchRepository.getAssetsByCity(ownerFilter);
    return assets.map((asset) => mapAsset(asset));
  }

  async getSearchSuggestions(auth: AuthDto, dto: SearchSuggestionRequestDto) {
    const ownerFilter = await this.getOwnerFilter(auth);
    const suggestions = await this.getSuggestions(ownerFilter, dto);
    if (dto.includeNull) {
      suggestions.push(null);
    }
    return suggestions;
  }

  private getSuggestions(ownerFilter: AssetOwnerFilter, dto: SearchSuggestionRequestDto): Promise<Array<string | null>> {
    switch (dto.type) {
      case SearchSuggestionType.COUNTRY: {
        return this.searchRepository.getCountries(ownerFilter);
      }
      case SearchSuggestionType.STATE: {
        return this.searchRepository.getStates(ownerFilter, dto);
      }
      case SearchSuggestionType.CITY: {
        return this.searchRepository.getCities(ownerFilter, dto);
      }
      case SearchSuggestionType.CAMERA_MAKE: {
        return this.searchRepository.getCameraMakes(ownerFilter, dto);
      }
      case SearchSuggestionType.CAMERA_MODEL: {
        return this.searchRepository.getCameraModels(ownerFilter, dto);
      }
      case SearchSuggestionType.CAMERA_LENS_MODEL: {
        return this.searchRepository.getCameraLensModels(ownerFilter, dto);
      }
      default: {
        return Promise.resolve([]);
      }
    }
  }

  private async getOwnerFilter(auth: AuthDto): Promise<AssetOwnerFilter> {
    const userIds = [auth.user.id];
    const partnerDateConstraints: PartnerDateConstraint[] = [];
    const partners = await getMyPartners({
      userId: auth.user.id,
      repository: this.partnerRepository,
      timelineEnabled: true,
    });
    for (const partner of partners) {
      if (partner.shareFromDate) {
        partnerDateConstraints.push({ userId: partner.id, shareFromDate: partner.shareFromDate });
      } else {
        userIds.push(partner.id);
      }
    }
    return { userIds, partnerDateConstraints };
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
