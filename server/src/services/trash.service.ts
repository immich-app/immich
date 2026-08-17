import { Injectable } from '@nestjs/common';
import { OnEvent, OnJob } from 'src/decorators';
import { BulkIdsDto } from 'src/dtos/asset-ids.response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { TrashResponseDto } from 'src/dtos/trash.dto';
import { JobName, JobStatus, Permission, QueueName } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { batched } from 'src/utils/misc';

@Injectable()
export class TrashService extends BaseService {
  async restoreAssets(auth: AuthDto, dto: BulkIdsDto): Promise<TrashResponseDto> {
    const { ids } = dto;
    if (ids.length === 0) {
      return { count: 0 };
    }

    await this.requireAccess({ auth, permission: Permission.AssetDelete, ids });
    await this.trashRepository.restoreAll(ids);
    await this.eventRepository.emit('AssetRestoreAll', { assetIds: ids, userId: auth.user.id });

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
      await this.jobRepository.queue({ name: JobName.AssetEmptyTrash, data: {} });
    }
    return { count };
  }

  @OnEvent({ name: 'AssetDeleteAll' })
  async onAssetsDelete() {
    await this.jobRepository.queue({ name: JobName.AssetEmptyTrash, data: {} });
  }

  @OnJob({ name: JobName.AssetEmptyTrash, queue: QueueName.BackgroundTask })
  async handleEmptyTrash() {
    let count = 0;
    for await (const assets of batched(this.trashRepository.getDeletedIds())) {
      await this.jobRepository.queueAll(
        assets.map(({ id }) => ({ name: JobName.AssetDelete, data: { id, deleteOnDisk: true } })),
      );
      count += assets.length;
    }

    this.logger.log(`Queued ${count} asset(s) for deletion from the trash`);

    return JobStatus.Success;
  }
}
