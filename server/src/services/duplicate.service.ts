import { Injectable } from '@nestjs/common';
import { JOBS_ASSET_PAGINATION_SIZE } from 'src/constants';
import { OnJob } from 'src/decorators';
import { mapAsset } from 'src/dtos/asset-response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { DuplicateResponseDto } from 'src/dtos/duplicate.dto';
import { JobName, JobStatus, QueueName } from 'src/enum';
import { AssetDuplicateResult } from 'src/repositories/search.repository';
import { BaseService } from 'src/services/base.service';
import { JobItem, JobOf } from 'src/types';
import { isDuplicateDetectionEnabled } from 'src/utils/misc';

@Injectable()
export class DuplicateService extends BaseService {
  async getDuplicates(auth: AuthDto): Promise<DuplicateResponseDto[]> {
    const duplicates = await this.assetRepository.getDuplicates(auth.user.id);
    return duplicates.map(({ duplicateId, assets }) => ({
      duplicateId,
      assets: assets.map((asset) => mapAsset(asset, { auth })),
    }));
  }

  @OnJob({ name: JobName.QUEUE_DUPLICATE_DETECTION, queue: QueueName.DUPLICATE_DETECTION })
  async handleQueueSearchDuplicates({ force }: JobOf<JobName.QUEUE_DUPLICATE_DETECTION>): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: false });
    if (!isDuplicateDetectionEnabled(machineLearning)) {
      return JobStatus.SKIPPED;
    }

    let jobs: JobItem[] = [];
    const queueAll = async () => {
      await this.jobRepository.queueAll(jobs);
      jobs = [];
    };

    const assets = this.assetJobRepository.streamForSearchDuplicates(force);
    for await (const asset of assets) {
      jobs.push({ name: JobName.DUPLICATE_DETECTION, data: { id: asset.id } });
      if (jobs.length >= JOBS_ASSET_PAGINATION_SIZE) {
        await queueAll();
      }
    }

    await queueAll();

    return JobStatus.SUCCESS;
  }

  @OnJob({ name: JobName.DUPLICATE_DETECTION, queue: QueueName.DUPLICATE_DETECTION })
  async handleSearchDuplicates({ id }: JobOf<JobName.DUPLICATE_DETECTION>): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: true });
    if (!isDuplicateDetectionEnabled(machineLearning)) {
      return JobStatus.SKIPPED;
    }

    const asset = await this.assetJobRepository.getForSearchDuplicatesJob(id);
    if (!asset) {
      this.logger.error(`Asset ${id} not found`);
      return JobStatus.FAILED;
    }

    return JobStatus.SUCCESS;
  }

  private async updateDuplicates(
    asset: { id: string; duplicateId: string | null },
    duplicateAssets: AssetDuplicateResult[],
  ): Promise<string[]> {
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
