import { ImmichLogger } from '@app/infra/logger';
import { Inject, Injectable } from '@nestjs/common';
import { AssetOrder, AssetResponseDto, mapAsset } from '../asset';
import { AuthDto } from '../auth';
import { PersonResponseDto } from '../person';
import {
  IAssetRepository,
  IMachineLearningRepository,
  IPartnerRepository,
  IPersonRepository,
  ISearchRepository,
  ISystemConfigRepository,
  SearchExploreItem,
} from '../repositories';
import { FeatureFlag, SystemConfigCore } from '../system-config';
import { MetadataSearchDto, SearchPeopleDto, SmartSearchDto } from './dto';
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
    const assets = await this.assetRepository.getByIds([...assetIds]);
    const assetMap = new Map<string, AssetResponseDto>(assets.map((asset) => [asset.id, mapAsset(asset)]));

    return results.map(({ fieldName, items }) => ({
      fieldName,
      items: items.map(({ value, data }) => ({ value, data: assetMap.get(data) as AssetResponseDto })),
    }));
  }

  async searchMetadata(auth: AuthDto, dto: MetadataSearchDto): Promise<SearchResponseDto> {
    let checksum: Buffer | undefined;

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
        ownerId: auth.user.id,
        orderDirection: dto.order ? enumToOrder[dto.order] : 'DESC',
      },
    );

    return {
      albums: { total: 0, count: 0, items: [], facets: [] },
      assets: {
        total: items.length,
        count: items.length,
        items: items.map((asset) => mapAsset(asset)),
        facets: [],
        nextPage: hasNextPage ? (page + 1).toString() : null,
      },
    };
  }

  async searchSmart(auth: AuthDto, dto: SmartSearchDto): Promise<SearchResponseDto> {
    await this.configCore.requireFeature(FeatureFlag.SEARCH);
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

    return {
      albums: { total: 0, count: 0, items: [], facets: [] },
      assets: {
        total: items.length,
        count: items.length,
        items: items.map((asset) => mapAsset(asset)),
        facets: [],
        nextPage: hasNextPage ? (page + 1).toString() : null,
      },
    };
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
}
