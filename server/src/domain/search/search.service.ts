import { AssetEntity } from '@app/infra/entities';
import { ImmichLogger } from '@app/infra/logger';
import { Inject, Injectable } from '@nestjs/common';
import { AssetOrder, AssetResponseDto, mapAsset } from '../asset';
import { AuthDto } from '../auth';
import { PersonResponseDto } from '../person';
import {
  IAssetRepository,
  IMachineLearningRepository,
  IMetadataRepository,
  IPartnerRepository,
  IPersonRepository,
  ISearchRepository,
  ISystemConfigRepository,
  SearchExploreItem,
  SearchStrategy,
} from '../repositories';
import { FeatureFlag, SystemConfigCore } from '../system-config';
import {
  MetadataSearchDto,
  PlacesResponseDto,
  SearchDto,
  SearchPeopleDto,
  SearchPlacesDto,
  SmartSearchDto,
  mapPlaces,
} from './dto';
import { SearchSuggestionRequestDto, SearchSuggestionType } from './dto/search-suggestion.dto';
import { SearchResponseDto } from './response-dto';

@Injectable()
export class SearchService {
  private logger = new ImmichLogger(SearchService.name);
  private configCore: SystemConfigCore;

  constructor(
    @Inject(ISystemConfigRepository) configRepository: ISystemConfigRepository,
    @Inject(IMachineLearningRepository) private machineLearning: IMachineLearningRepository,
    @Inject(IPersonRepository) private personRepository: IPersonRepository,
    @Inject(ISearchRepository) private searchRepository: ISearchRepository,
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(IPartnerRepository) private partnerRepository: IPartnerRepository,
    @Inject(IMetadataRepository) private metadataRepository: IMetadataRepository,
  ) {
    this.configCore = SystemConfigCore.create(configRepository);
  }

  async searchPerson(auth: AuthDto, dto: SearchPeopleDto): Promise<PersonResponseDto[]> {
    return this.personRepository.getByName(auth.user.id, dto.name, { withHidden: dto.withHidden });
  }

  async searchPlaces(dto: SearchPlacesDto): Promise<PlacesResponseDto[]> {
    const places = await this.searchRepository.searchPlaces(dto.name);
    return places.map((place) => mapPlaces(place));
  }

  async getExploreData(auth: AuthDto): Promise<SearchExploreItem<AssetResponseDto>[]> {
    await this.configCore.requireFeature(FeatureFlag.SEARCH);
    const options = { maxFields: 12, minAssetsPerField: 5 };
    const results = await Promise.all([
      this.assetRepository.getAssetIdByCity(auth.user.id, options),
      this.assetRepository.getAssetIdByTag(auth.user.id, options),
    ]);
    const assetIds = new Set<string>(results.flatMap((field) => field.items.map((item) => item.data)));
    const assets = await this.assetRepository.getByIds([...assetIds]);
    const assetMap = new Map<string, AssetResponseDto>(assets.map((asset) => [asset.id, mapAsset(asset)]));

    return results.map(({ fieldName, items }) => ({
      fieldName,
      items: items.map(({ value, data }) => ({ value, data: assetMap.get(data) as AssetResponseDto })),
    }));
  }

  async searchMetadata(auth: AuthDto, dto: MetadataSearchDto): Promise<SearchResponseDto> {
    let checksum: Buffer | undefined;
    const userIds = await this.getUserIdsToSearch(auth);

    if (dto.checksum) {
      const encoding = dto.checksum.length === 28 ? 'base64' : 'hex';
      checksum = Buffer.from(dto.checksum, encoding);
    }

    const page = dto.page ?? 1;
    const size = dto.size || 250;
    const enumToOrder = { [AssetOrder.ASC]: 'ASC', [AssetOrder.DESC]: 'DESC' } as const;
    const { hasNextPage, items } = await this.searchRepository.searchMetadata(
      { page, size },
      {
        ...dto,
        checksum,
        userIds,
        orderDirection: dto.order ? enumToOrder[dto.order] : 'DESC',
      },
    );

    return this.mapResponse(items, hasNextPage ? (page + 1).toString() : null);
  }

  async searchSmart(auth: AuthDto, dto: SmartSearchDto): Promise<SearchResponseDto> {
    await this.configCore.requireFeature(FeatureFlag.SMART_SEARCH);
    const { machineLearning } = await this.configCore.getConfig();
    const userIds = await this.getUserIdsToSearch(auth);

    const embedding = await this.machineLearning.encodeText(
      machineLearning.url,
      { text: dto.query },
      machineLearning.clip,
    );

    const page = dto.page ?? 1;
    const size = dto.size || 100;
    const { hasNextPage, items } = await this.searchRepository.searchSmart(
      { page, size },
      { ...dto, userIds, embedding },
    );

    return this.mapResponse(items, hasNextPage ? (page + 1).toString() : null);
  }

  // TODO: remove after implementing new search filters
  /** @deprecated */
  async search(auth: AuthDto, dto: SearchDto): Promise<SearchResponseDto> {
    await this.configCore.requireFeature(FeatureFlag.SEARCH);
    const { machineLearning } = await this.configCore.getConfig();
    const query = dto.q || dto.query;
    if (!query) {
      throw new Error('Missing query');
    }

    let strategy = SearchStrategy.TEXT;
    if (dto.smart || dto.clip) {
      await this.configCore.requireFeature(FeatureFlag.SMART_SEARCH);
      strategy = SearchStrategy.SMART;
    }

    const userIds = await this.getUserIdsToSearch(auth);
    const page = dto.page ?? 1;

    let nextPage: string | null = null;
    let assets: AssetEntity[] = [];
    switch (strategy) {
      case SearchStrategy.SMART: {
        const embedding = await this.machineLearning.encodeText(
          machineLearning.url,
          { text: query },
          machineLearning.clip,
        );

        const { hasNextPage, items } = await this.searchRepository.searchSmart(
          { page, size: dto.size || 100 },
          {
            userIds,
            embedding,
            withArchived: !!dto.withArchived,
          },
        );
        if (hasNextPage) {
          nextPage = (page + 1).toString();
        }
        assets = items;
        break;
      }
      case SearchStrategy.TEXT: {
        assets = await this.assetRepository.searchMetadata(query, userIds, { numResults: dto.size || 250 });
      }
      default: {
        break;
      }
    }

    return this.mapResponse(assets, nextPage);
  }

  private async getUserIdsToSearch(auth: AuthDto): Promise<string[]> {
    const userIds: string[] = [auth.user.id];
    const partners = await this.partnerRepository.getAll(auth.user.id);
    const partnersIds = partners
      .filter((partner) => partner.sharedBy && partner.inTimeline)
      .map((partner) => partner.sharedById);
    userIds.push(...partnersIds);
    return userIds;
  }

  private async mapResponse(assets: AssetEntity[], nextPage: string | null): Promise<SearchResponseDto> {
    return {
      albums: { total: 0, count: 0, items: [], facets: [] },
      assets: {
        total: assets.length,
        count: assets.length,
        items: assets.map((asset) => mapAsset(asset)),
        facets: [],
        nextPage,
      },
    };
  }

  async getSearchSuggestions(auth: AuthDto, dto: SearchSuggestionRequestDto): Promise<string[]> {
    if (dto.type === SearchSuggestionType.COUNTRY) {
      return this.metadataRepository.getCountries(auth.user.id);
    }

    if (dto.type === SearchSuggestionType.STATE) {
      return this.metadataRepository.getStates(auth.user.id, dto.country);
    }

    if (dto.type === SearchSuggestionType.CITY) {
      return this.metadataRepository.getCities(auth.user.id, dto.country, dto.state);
    }

    if (dto.type === SearchSuggestionType.CAMERA_MAKE) {
      return this.metadataRepository.getCameraMakes(auth.user.id, dto.model);
    }

    if (dto.type === SearchSuggestionType.CAMERA_MODEL) {
      return this.metadataRepository.getCameraModels(auth.user.id, dto.make);
    }

    return [];
  }
}
