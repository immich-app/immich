import { Inject } from '@nestjs/common';
import { DateTime } from 'luxon';
import { AccessCore, Permission } from 'src/cores/access.core';
import { BulkIdsDto } from 'src/dtos/asset-ids.response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { IAccessRepository } from 'src/interfaces/access.interface';
import { IAssetRepository } from 'src/interfaces/asset.interface';
import { ClientEvent, IEventRepository } from 'src/interfaces/event.interface';
import { IJobRepository, JOBS_ASSET_PAGINATION_SIZE, JobName } from 'src/interfaces/job.interface';
import { usePagination } from 'src/utils/pagination';

export class TrashService {
  private access: AccessCore;

  constructor(
    @Inject(IAccessRepository) accessRepository: IAccessRepository,
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(IEventRepository) private eventRepository: IEventRepository,
  ) {
    this.access = AccessCore.create(accessRepository);
  }

  async restoreAssets(auth: AuthDto, dto: BulkIdsDto): Promise<void> {
    const { ids } = dto;
    await this.access.requirePermission(auth, Permission.ASSET_RESTORE, ids);
    await this.restoreAndSend(auth, ids);
  }

  async restore(auth: AuthDto): Promise<void> {
    const assetPagination = usePagination(JOBS_ASSET_PAGINATION_SIZE, (pagination) =>
      this.assetRepository.getByUserId(pagination, auth.user.id, {
        trashedBefore: DateTime.now().toJSDate(),
      }),
    );

    for await (const assets of assetPagination) {
      const ids = assets.map((a) => a.id);
      await this.restoreAndSend(auth, ids);
    }
  }

  async empty(auth: AuthDto): Promise<void> {
    const assetPagination = usePagination(JOBS_ASSET_PAGINATION_SIZE, (pagination) =>
      this.assetRepository.getByUserId(pagination, auth.user.id, {
        trashedBefore: DateTime.now().toJSDate(),
      }),
    );

    for await (const assets of assetPagination) {
      await this.jobRepository.queueAll(
        assets.map((asset) => ({ name: JobName.ASSET_DELETION, data: { id: asset.id } })),
      );
    }
  }

  private async restoreAndSend(auth: AuthDto, ids: string[]) {
    if (ids.length === 0) {
      return;
    }

    await this.assetRepository.restoreAll(ids);
    this.eventRepository.clientSend(ClientEvent.ASSET_RESTORE, auth.user.id, ids);
  }
}
