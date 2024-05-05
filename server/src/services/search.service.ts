import { Inject, Injectable } from '@nestjs/common';
import { FeatureFlag, SystemConfigCore } from 'src/cores/system-config.core';
import { AssetResponseDto, mapAsset } from 'src/dtos/asset-response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { PersonResponseDto } from 'src/dtos/person.dto';
import {
  MetadataSearchDto,
  PlacesResponseDto,
  SearchPeopleDto,
  SearchPlacesDto,
  SearchResponseDto,
  SearchSuggestionRequestDto,
  SearchSuggestionType,
  SmartSearchDto,
  mapPlaces,
} from 'src/dtos/search.dto';
import { AssetOrder } from 'src/entities/album.entity';
import { AssetEntity } from 'src/entities/asset.entity';
import { IAssetRepository, WithoutProperty } from 'src/interfaces/asset.interface';
import { ICryptoRepository } from 'src/interfaces/crypto.interface';
import {
  IBaseJob,
  IEntityJob,
  IJobRepository,
  JOBS_ASSET_PAGINATION_SIZE,
  JobName,
  JobStatus,
} from 'src/interfaces/job.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IMachineLearningRepository } from 'src/interfaces/machine-learning.interface';
import { IMetadataRepository } from 'src/interfaces/metadata.interface';
import { IPartnerRepository } from 'src/interfaces/partner.interface';
import { IPersonRepository } from 'src/interfaces/person.interface';
import { AssetDuplicateResult, ISearchRepository, SearchExploreItem } from 'src/interfaces/search.interface';
import { ISystemConfigRepository } from 'src/interfaces/system-config.interface';
import { usePagination } from 'src/utils/pagination';

@Injectable()
export class SearchService {
  private configCore: SystemConfigCore;

  constructor(
    @Inject(ISystemConfigRepository) configRepository: ISystemConfigRepository,
    @Inject(IMachineLearningRepository) private machineLearning: IMachineLearningRepository,
    @Inject(IPersonRepository) private personRepository: IPersonRepository,
    @Inject(ISearchRepository) private searchRepository: ISearchRepository,
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(IPartnerRepository) private partnerRepository: IPartnerRepository,
    @Inject(IMetadataRepository) private metadataRepository: IMetadataRepository,
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
    @Inject(ICryptoRepository) private cryptoRepository: ICryptoRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
  ) {
    this.logger.setContext(SearchService.name);
    this.configCore = SystemConfigCore.create(configRepository, logger);
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
    const assets = await this.assetRepository.getByIdsWithAllRelations([...assetIds]);
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

    dto.previewPath ??= dto.resizePath;
    dto.thumbnailPath ??= dto.webpPath;

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

  async getAssetsByCity(auth: AuthDto): Promise<AssetResponseDto[]> {
    const userIds = await this.getUserIdsToSearch(auth);
    const assets = await this.searchRepository.getAssetsByCity(userIds);
    return assets.map((asset) => mapAsset(asset));
  }

  getSearchSuggestions(auth: AuthDto, dto: SearchSuggestionRequestDto): Promise<string[]> {
    switch (dto.type) {
      case SearchSuggestionType.COUNTRY: {
        return this.metadataRepository.getCountries(auth.user.id);
      }
      case SearchSuggestionType.STATE: {
        return this.metadataRepository.getStates(auth.user.id, dto.country);
      }
      case SearchSuggestionType.CITY: {
        return this.metadataRepository.getCities(auth.user.id, dto.country, dto.state);
      }
      case SearchSuggestionType.CAMERA_MAKE: {
        return this.metadataRepository.getCameraMakes(auth.user.id, dto.model);
      }
      case SearchSuggestionType.CAMERA_MODEL: {
        return this.metadataRepository.getCameraModels(auth.user.id, dto.make);
      }
    }
  }

  async handleQueueSearchDuplicates({ force }: IBaseJob): Promise<JobStatus> {
    const { machineLearning } = await this.configCore.getConfig();
    if (!machineLearning.enabled || !machineLearning.clip.enabled) {
      return JobStatus.SKIPPED;
    }

    const assetPagination = usePagination(JOBS_ASSET_PAGINATION_SIZE, (pagination) => {
      return force
        ? this.assetRepository.getAll(pagination, { isVisible: true })
        : this.assetRepository.getWithout(pagination, WithoutProperty.DUPLICATE);
    });

    for await (const assets of assetPagination) {
      await this.jobRepository.queueAll(
        assets.map((asset) => ({ name: JobName.DUPLICATE_DETECTION, data: { id: asset.id } })),
      );
    }

    return JobStatus.SUCCESS;
  }

  async handleSearchDuplicates({ id }: IEntityJob): Promise<JobStatus> {
    const { machineLearning } = await this.configCore.getConfig();
    if (!machineLearning.enabled || !machineLearning.clip.enabled) {
      return JobStatus.SKIPPED;
    }

    const asset = await this.assetRepository.getById(id, { smartSearch: true });
    if (!asset) {
      this.logger.error(`Asset ${id} not found`);
      return JobStatus.FAILED;
    }

    if (!asset.isVisible) {
      this.logger.debug(`Asset ${id} is not visible, skipping`);
      return JobStatus.SKIPPED;
    }

    if (!asset.previewPath) {
      this.logger.warn(`Asset ${id} is missing preview image`);
      return JobStatus.FAILED;
    }

    if (!asset.smartSearch?.embedding) {
      this.logger.debug(`Asset ${id} is missing embedding`);
      return JobStatus.FAILED;
    }

    const duplicateAssets = await this.searchRepository.searchDuplicates({
      assetId: asset.id,
      embedding: asset.smartSearch.embedding,
      maxDistance: machineLearning.clip.duplicateThreshold,
      userIds: [asset.ownerId],
    });

    let assetIds = [asset.id];
    if (duplicateAssets.length > 0) {
      this.logger.debug(
        `Found ${duplicateAssets.length} duplicate${duplicateAssets.length === 1 ? '' : 's'} for asset ${asset.id}`,
      );
      assetIds = await this.updateDuplicates(asset, duplicateAssets);
    } else if (asset.duplicateId) {
      this.logger.debug(`No duplicates found for asset ${asset.id}, removing duplicateId`);
      await this.assetRepository.update({ id: asset.id, duplicateId: null });
    }

    const duplicatesDetectedAt = new Date();
    await this.assetRepository.upsertJobStatus(...assetIds.map((assetId) => ({ assetId, duplicatesDetectedAt })));

    return JobStatus.SUCCESS;
  }

  private async updateDuplicates(asset: AssetEntity, duplicateAssets: AssetDuplicateResult[]): Promise<string[]> {
    const duplicateIds = [
      ...new Set(
        duplicateAssets
          .filter((asset): asset is AssetDuplicateResult & { duplicateId: string } => !!asset.duplicateId)
          .map((duplicate) => duplicate.duplicateId),
      ),
    ];

    const targetDuplicateId = asset.duplicateId ?? duplicateIds.shift() ?? this.cryptoRepository.randomUUID();
    const assetIdsToUpdate = duplicateAssets
      .filter((asset) => asset.duplicateId !== targetDuplicateId)
      .map((duplicate) => duplicate.assetId);
    assetIdsToUpdate.push(asset.id);

    await this.assetRepository.updateDuplicates({ targetDuplicateId, assetIds: assetIdsToUpdate, duplicateIds });
    return assetIdsToUpdate;
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

  private mapResponse(assets: AssetEntity[], nextPage: string | null): SearchResponseDto {
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
}
