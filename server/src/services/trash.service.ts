import { Injectable } from '@nestjs/common';
import { JOBS_ASSET_PAGINATION_SIZE } from 'src/constants';
import { OnEvent, OnJob } from 'src/decorators';
import { BulkIdsDto } from 'src/dtos/asset-ids.response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { TrashResponseDto } from 'src/dtos/trash.dto';
import { JobName, JobStatus, Permission, QueueName } from 'src/enum';
import { BaseService } from 'src/services/base.service';

@Injectable()
export class TrashService extends BaseService {
  async restoreAssets(auth: AuthDto, dto: BulkIdsDto): Promise<TrashResponseDto> {
    const { ids } = dto;
    if (ids.length === 0) {
      return { count: 0 };
    }

    await this.requireAccess({ auth, permission: Permission.ASSET_DELETE, ids });
    await this.trashRepository.restoreAll(ids);
    await this.eventRepository.emit('assets.restore', { assetIds: ids, userId: auth.user.id });

    this.logger.log(`Restored ${ids.length} asset(s) from trash`);

    return { count: ids.length };
  }

  async restore(auth: AuthDto): Promise<TrashResponseDto> {
    const count = await this.trashRepository.restore(auth.user.id);
    if (count > 0) {
      this.logger.log(`Restored ${count} asset(s) from trash`);
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

  @OnJob({ name: JobName.QUEUE_TRASH_EMPTY, queue: QueueName.BACKGROUND_TASK })
  async handleQueueEmptyTrash() {
    const assets = this.trashRepository.getDeletedIds();

    let count = 0;
    const batch: string[] = [];
    for await (const { id } of assets) {
      batch.push(id);

      if (batch.length === JOBS_ASSET_PAGINATION_SIZE) {
        await this.handleBatch(batch);
        count += batch.length;
        batch.length = 0;
      }
    }

    await this.handleBatch(batch);
    count += batch.length;
    batch.length = 0;

    this.logger.log(`Queued ${count} asset(s) for deletion from the trash`);

    return JobStatus.SUCCESS;
  }

  private async handleBatch(ids: string[]) {
    this.logger.debug(`Queueing ${ids.length} asset(s) for deletion from the trash`);
    await this.jobRepository.queueAll(
      ids.map((assetId) => ({
        name: JobName.ASSET_DELETION,
        data: {
          id: assetId,
          deleteOnDisk: true,
        },
      })),
    );
  }
}
