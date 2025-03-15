import { BadRequestException, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { OnJob } from 'src/decorators';
import { BulkIdResponseDto, BulkIdsDto } from 'src/dtos/asset-ids.response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { MemoryCreateDto, MemoryResponseDto, MemorySearchDto, MemoryUpdateDto, mapMemory } from 'src/dtos/memory.dto';
import { OnThisDayData } from 'src/entities/memory.entity';
import { JobName, MemoryType, Permission, QueueName, SystemMetadataKey } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { addAssets, getMyPartnerIds, removeAssets } from 'src/utils/asset.util';

const DAYS = 3;

@Injectable()
export class MemoryService extends BaseService {
  @OnJob({ name: JobName.MEMORIES_CREATE, queue: QueueName.BACKGROUND_TASK })
  async onMemoriesCreate() {
    const users = await this.userRepository.getList({ withDeleted: false });
    const userMap: Record<string, string[]> = {};
    for (const user of users) {
      const partnerIds = await getMyPartnerIds({
        userId: user.id,
        repository: this.partnerRepository,
        timelineEnabled: true,
      });
      userMap[user.id] = [user.id, ...partnerIds];
    }

    const start = DateTime.utc().startOf('day').minus({ days: DAYS });

    const state = await this.systemMetadataRepository.get(SystemMetadataKey.MEMORIES_STATE);
    const lastOnThisDayDate = state?.lastOnThisDayDate ? DateTime.fromISO(state.lastOnThisDayDate) : start;

    // generate a memory +/- X days from today
    for (let i = 0; i <= DAYS * 2; i++) {
      const target = start.plus({ days: i });
      if (lastOnThisDayDate >= target) {
        continue;
      }

      const showAt = target.startOf('day').toISO();
      const hideAt = target.endOf('day').toISO();

      for (const [userId, userIds] of Object.entries(userMap)) {
        const memories = await this.assetRepository.getByDayOfYear(userIds, target);

        for (const { year, assets } of memories) {
          const data: OnThisDayData = { year };
          await this.memoryRepository.create(
            {
              ownerId: userId,
              type: MemoryType.ON_THIS_DAY,
              data,
              memoryAt: target.set({ year }).toISO(),
              showAt,
              hideAt,
            },
            new Set(assets.map(({ id }) => id)),
          );
        }
      }

      await this.systemMetadataRepository.set(SystemMetadataKey.MEMORIES_STATE, {
        ...state,
        lastOnThisDayDate: target.toISO(),
      });
    }
  }

  @OnJob({ name: JobName.MEMORIES_CLEANUP, queue: QueueName.BACKGROUND_TASK })
  async onMemoriesCleanup() {
    await this.memoryRepository.cleanup();
  }

  async search(auth: AuthDto, dto: MemorySearchDto) {
    const memories = await this.memoryRepository.search(auth.user.id, dto);
    return memories.map((memory) => mapMemory(memory));
  }

  async get(auth: AuthDto, id: string): Promise<MemoryResponseDto> {
    await this.requireAccess({ auth, permission: Permission.MEMORY_READ, ids: [id] });
    const memory = await this.findOrFail(id);
    return mapMemory(memory);
  }

  async create(auth: AuthDto, dto: MemoryCreateDto) {
    // TODO validate type/data combination

    const assetIds = dto.assetIds || [];
    const allowedAssetIds = await this.checkAccess({
      auth,
      permission: Permission.ASSET_SHARE,
      ids: assetIds,
    });
    const memory = await this.memoryRepository.create(
      {
        ownerId: auth.user.id,
        type: dto.type,
        data: dto.data,
        isSaved: dto.isSaved,
        memoryAt: dto.memoryAt,
        seenAt: dto.seenAt,
      },
      allowedAssetIds,
    );

    return mapMemory(memory);
  }

  async update(auth: AuthDto, id: string, dto: MemoryUpdateDto): Promise<MemoryResponseDto> {
    await this.requireAccess({ auth, permission: Permission.MEMORY_UPDATE, ids: [id] });

    const memory = await this.memoryRepository.update(id, {
      isSaved: dto.isSaved,
      memoryAt: dto.memoryAt,
      seenAt: dto.seenAt,
    });

    return mapMemory(memory);
  }

  async remove(auth: AuthDto, id: string): Promise<void> {
    await this.requireAccess({ auth, permission: Permission.MEMORY_DELETE, ids: [id] });
    await this.memoryRepository.delete(id);
  }

  async addAssets(auth: AuthDto, id: string, dto: BulkIdsDto): Promise<BulkIdResponseDto[]> {
    await this.requireAccess({ auth, permission: Permission.MEMORY_READ, ids: [id] });

    const repos = { access: this.accessRepository, bulk: this.memoryRepository };
    const results = await addAssets(auth, repos, { parentId: id, assetIds: dto.ids });

    const hasSuccess = results.find(({ success }) => success);
    if (hasSuccess) {
      await this.memoryRepository.update(id, { updatedAt: new Date() });
    }

    return results;
  }

  async removeAssets(auth: AuthDto, id: string, dto: BulkIdsDto): Promise<BulkIdResponseDto[]> {
    await this.requireAccess({ auth, permission: Permission.MEMORY_UPDATE, ids: [id] });

    const repos = { access: this.accessRepository, bulk: this.memoryRepository };
    const results = await removeAssets(auth, repos, {
      parentId: id,
      assetIds: dto.ids,
      canAlwaysRemove: Permission.MEMORY_DELETE,
    });

    const hasSuccess = results.find(({ success }) => success);
    if (hasSuccess) {
      await this.memoryRepository.update(id, { id, updatedAt: new Date() });
    }

    return results;
  }

  private async findOrFail(id: string) {
    const memory = await this.memoryRepository.get(id);
    if (!memory) {
      throw new BadRequestException('Memory not found');
    }
    return memory;
  }
}
