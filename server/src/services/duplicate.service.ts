import { Inject, Injectable } from '@nestjs/common';
import { SystemConfigCore } from 'src/cores/system-config.core';
import { mapAsset } from 'src/dtos/asset-response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { DuplicateResponseDto, mapDuplicateResponse } from 'src/dtos/duplicate.dto';
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
import { AssetDuplicateResult, ISearchRepository } from 'src/interfaces/search.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { isDuplicateDetectionEnabled } from 'src/utils/misc';
import { usePagination } from 'src/utils/pagination';

@Injectable()
export class DuplicateService {
  private configCore: SystemConfigCore;

  constructor(
    @Inject(ISystemMetadataRepository) systemMetadataRepository: ISystemMetadataRepository,
    @Inject(ISearchRepository) private searchRepository: ISearchRepository,
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
    @Inject(ICryptoRepository) private cryptoRepository: ICryptoRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
  ) {
    this.logger.setContext(DuplicateService.name);
    this.configCore = SystemConfigCore.create(systemMetadataRepository, logger);
  }

  async getDuplicates(auth: AuthDto): Promise<DuplicateResponseDto[]> {
    const res = await this.assetRepository.getDuplicates({ userIds: [auth.user.id] });

    return mapDuplicateResponse(res.map((a) => mapAsset(a, { auth })));
  }

  async handleQueueSearchDuplicates({ force }: IBaseJob): Promise<JobStatus> {
    const { machineLearning } = await this.configCore.getConfig();
    if (!isDuplicateDetectionEnabled(machineLearning)) {
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
    if (!isDuplicateDetectionEnabled(machineLearning)) {
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
      maxDistance: machineLearning.duplicateDetection.maxDistance,
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
}
