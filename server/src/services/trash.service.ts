import { OnEvent } from 'src/decorators';
import { BulkIdsDto } from 'src/dtos/asset-ids.response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { TrashResponseDto } from 'src/dtos/trash.dto';
import { Permission } from 'src/enum';
import { JOBS_ASSET_PAGINATION_SIZE, JobName, JobStatus } from 'src/interfaces/job.interface';
import { BaseService } from 'src/services/base.service';
import { usePagination } from 'src/utils/pagination';

export class TrashService extends BaseService {
  async restoreAssets(auth: AuthDto, dto: BulkIdsDto): Promise<TrashResponseDto> {
    const { ids } = dto;
    if (ids.length === 0) {
      return { count: 0 };
    }

    await this.requireAccess({ auth, permission: Permission.ASSET_DELETE, ids });
    await this.trashRepository.restoreAll(ids);
    await this.eventRepository.emit('assets.restore', { assetIds: ids, userId: auth.user.id });

    this.logger.log(`Restored ${ids.length} assets from trash`);

    return { count: ids.length };
  }

  async restore(auth: AuthDto): Promise<TrashResponseDto> {
    const count = await this.trashRepository.restore(auth.user.id);
    if (count > 0) {
      this.logger.log(`Restored ${count} assets from trash`);
    }
    return { count };
  }

  async empty(auth: AuthDto): Promise<TrashResponseDto> {
    const count = await this.trashRepository.empty(auth.user.id);
    if (count > 0) {
      await this.jobRepository.queue({ name: JobName.QUEUE_TRASH_EMPTY, data: {} });
    }
    return { count };
  }

  @OnEvent({ name: 'assets.delete' })
  async onAssetsDelete() {
    await this.jobRepository.queue({ name: JobName.QUEUE_TRASH_EMPTY, data: {} });
  }

  async handleQueueEmptyTrash() {
    let count = 0;
    const assetPagination = usePagination(JOBS_ASSET_PAGINATION_SIZE, (pagination) =>
      this.trashRepository.getDeletedIds(pagination),
    );

    for await (const assetIds of assetPagination) {
      this.logger.debug(`Queueing ${assetIds.length} assets for deletion from the trash`);
      count += assetIds.length;
      await this.jobRepository.queueAll(
        assetIds.map((assetId) => ({
          name: JobName.ASSET_DELETION,
          data: {
            id: assetId,
            deleteOnDisk: true,
          },
        })),
      );
    }

    this.logger.log(`Queued ${count} assets for deletion from the trash`);

    return JobStatus.SUCCESS;
  }
}
