import { AssetEntity } from '@app/infra/entities';
import { ImmichLogger } from '@app/infra/logger';
import { Inject, Injectable } from '@nestjs/common';
import { AssetResponseDto, mapAsset } from '../asset';
import { AuthDto } from '../auth';
import { PersonResponseDto } from '../person';
import {
  IAssetRepository,
  IMachineLearningRepository,
  IPersonRepository,
  ISmartInfoRepository,
  ISystemConfigRepository,
  SearchExploreItem,
  SearchStrategy,
} from '../repositories';
import { FeatureFlag, SystemConfigCore } from '../system-config';
import { SearchDto, SearchPeopleDto } from './dto';
import { SearchResponseDto } from './response-dto';

@Injectable()
export class SearchService {
  private logger = new ImmichLogger(SearchService.name);
  private configCore: SystemConfigCore;

  constructor(
    @Inject(ISystemConfigRepository) configRepository: ISystemConfigRepository,
    @Inject(IMachineLearningRepository) private machineLearning: IMachineLearningRepository,
    @Inject(IPersonRepository) private personRepository: IPersonRepository,
    @Inject(ISmartInfoRepository) private smartInfoRepository: ISmartInfoRepository,
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
  ) {
    this.configCore = SystemConfigCore.create(configRepository);
  }

  async searchPerson(auth: AuthDto, dto: SearchPeopleDto): Promise<PersonResponseDto[]> {
    return this.personRepository.getByName(auth.user.id, dto.name, { withHidden: dto.withHidden });
  }

  async getExploreData(auth: AuthDto): Promise<SearchExploreItem<AssetResponseDto>[]> {
    await this.configCore.requireFeature(FeatureFlag.SEARCH);
    const options = { maxFields: 12, minAssetsPerField: 5 };
    const results = await Promise.all([
      this.assetRepository.getAssetIdByCity(auth.user.id, options),
      this.assetRepository.getAssetIdByTag(auth.user.id, options),
    ]);
    const assetIds = new Set<string>(results.flatMap((field) => field.items.map((item) => item.data)));
    const assets = await this.assetRepository.getByIds(Array.from(assetIds));
    const assetMap = new Map<string, AssetResponseDto>(assets.map((asset) => [asset.id, mapAsset(asset)]));

    return results.map(({ fieldName, items }) => ({
      fieldName,
      items: items.map(({ value, data }) => ({ value, data: assetMap.get(data) as AssetResponseDto })),
    }));
  }

  async search(auth: AuthDto, dto: SearchDto): Promise<SearchResponseDto> {
    const { machineLearning } = await this.configCore.getConfig();
    const query = dto.q || dto.query;
    if (!query) {
      throw new Error('Missing query');
    }
    const hasClip = machineLearning.enabled && machineLearning.clip.enabled;
    if (dto.clip && !hasClip) {
      throw new Error('CLIP is not enabled');
    }
    const strategy = dto.clip ? SearchStrategy.CLIP : SearchStrategy.TEXT;

    let assets: AssetEntity[] = [];

    switch (strategy) {
      case SearchStrategy.CLIP:
        const embedding = await this.machineLearning.encodeText(
          machineLearning.url,
          { text: query },
          machineLearning.clip,
        );
        assets = await this.smartInfoRepository.searchCLIP({ ownerId: auth.user.id, embedding, numResults: 100 });
        break;
      case SearchStrategy.TEXT:
        assets = await this.assetRepository.searchMetadata(query, auth.user.id, { numResults: 250 });
      default:
        break;
    }

    return {
      albums: {
        total: 0,
        count: 0,
        items: [],
        facets: [],
      },
      assets: {
        total: assets.length,
        count: assets.length,
        items: assets.map((asset) => mapAsset(asset)),
        facets: [],
      },
    };
  }
}
