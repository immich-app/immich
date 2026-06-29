import { BadRequestException, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { Memory } from 'src/database';
import { OnJob } from 'src/decorators';
import { BulkIdResponseDto, BulkIdsDto } from 'src/dtos/asset-ids.response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { MemoryCreateDto, MemoryResponseDto, MemorySearchDto, MemoryUpdateDto, mapMemory } from 'src/dtos/memory.dto';
import { DatabaseLock, JobName, MemoryType, Permission, QueueName, SystemMetadataKey } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { addAssets, removeAssets } from 'src/utils/asset.util';
import { isSmartSearchEnabled } from 'src/utils/misc';

const DAYS = 3;

@Injectable()
export class MemoryService extends BaseService {
  @OnJob({ name: JobName.MemoryGenerate, queue: QueueName.BackgroundTask })
  async onMemoriesCreate() {
    const users = await this.userRepository.getList({ withDeleted: false });

    await this.databaseRepository.withLock(DatabaseLock.MemoryCreation, async () => {
      const state = await this.systemMetadataRepository.get(SystemMetadataKey.MemoriesState);
      const start = DateTime.utc().startOf('day').minus({ days: DAYS });
      const lastOnThisDayDate = state?.lastOnThisDayDate ? DateTime.fromISO(state.lastOnThisDayDate) : start;

      // generate a memory +/- X days from today
      for (let i = 0; i <= DAYS * 2; i++) {
        const target = start.plus({ days: i });
        if (lastOnThisDayDate >= target) {
          continue;
        }

        this.logger.log(`Creating memories for ${target.toISO()}`);
        try {
          const { machineLearning } = await this.getConfig({ withCache: false });
          const isMlEnabled = isSmartSearchEnabled(machineLearning);
          
          await Promise.all(users.map(async (owner) => {
            await this.createOnThisDayMemories(owner.id, target);
            if (isMlEnabled) {
              await this.createAestheticMemories(owner.id, target, machineLearning);
            }
          }));
        } catch (error) {
          this.logger.error(`Failed to create memories for ${target.toISO()}: ${error}`);
        }
        // update system metadata even when there is an error to minimize the chance of duplicates
        await this.systemMetadataRepository.set(SystemMetadataKey.MemoriesState, {
          ...state,
          lastOnThisDayDate: target.toISO(),
        });
      }
    });
  }

  private async createOnThisDayMemories(ownerId: string, target: DateTime) {
    const showAt = target.startOf('day').toISO();
    const hideAt = target.endOf('day').toISO();
    const memories = await this.assetRepository.getByDayOfYear([ownerId], target);
    await Promise.all(
      memories.map(({ year, assets }) =>
        this.memoryRepository.create(
          {
            ownerId,
            type: MemoryType.OnThisDay,
            data: { year },
            memoryAt: target.set({ year }).toISO()!,
            showAt,
            hideAt,
          },
          new Set(assets.map(({ id }) => id)),
        ),
      ),
    );
  }

  private async createAestheticMemories(ownerId: string, target: DateTime, machineLearning: any) {
    const showAt = target.startOf('day').toISO();
    const hideAt = target.endOf('day').toISO();
    const modelName = machineLearning.clip.modelName;

    const createMemory = async (type: MemoryType, title: string | null, prompt: string | null, takenAfter: Date, takenBefore: Date, limit: number) => {
      let embedding: string | undefined;
      const searchPrompt = prompt || "beautiful, aesthetic, high quality photography, masterpiece";
      try {
        embedding = await this.machineLearningRepository.encodeText(searchPrompt, { modelName, language: 'en' });
      } catch (e) {
        this.logger.error(`Failed to encode text for memory type ${type}: ${e}`);
        return;
      }

      if (!embedding) return;

      const { items } = await this.searchRepository.searchSmart(
        { page: 1, size: limit },
        { 
          userIds: [ownerId], 
          embedding, 
          takenAfter, 
          takenBefore, 
          withStacked: true, 
          isFavorite: false,
          isMotion: false 
        }
      );
      
      if (items.length >= 3) {
        await this.memoryRepository.create(
          {
            ownerId,
            type,
            data: { year: target.year, ...(title ? { title } : {}) },
            memoryAt: target.toISO()!,
            showAt,
            hideAt,
          },
          new Set(items.map((i) => i.id)),
        );
      }
    };

    const targetDate = target.toJSDate();

    // Highlight Week: Sunday
    if (target.weekday === 7) {
      await createMemory(MemoryType.HighlightWeek, null, null, target.minus({ days: 7 }).toJSDate(), targetDate, 10);
    }
    // Highlight Month: 1st of the month
    if (target.day === 1) {
      await createMemory(MemoryType.HighlightMonth, null, null, target.minus({ months: 1 }).toJSDate(), targetDate, 15);
    }
    // Highlight Year: Dec 31
    if (target.month === 12 && target.day === 31) {
      await createMemory(MemoryType.HighlightYear, null, null, target.minus({ years: 1 }).toJSDate(), targetDate, 30);
    }
    // Golden Hour: Wednesday
    if (target.weekday === 3) {
      await createMemory(MemoryType.GoldenHour, null, "beautiful sunset or sunrise, golden hour, aesthetic", target.minus({ months: 1 }).toJSDate(), targetDate, 10);
    }
    // Forest Shade: Saturday
    if (target.weekday === 6) {
      await createMemory(MemoryType.ForestShade, null, "beautiful lush green forest, trees, nature, under the shade of forests", target.minus({ months: 1 }).toJSDate(), targetDate, 10);
    }

    // Custom Aesthetic Memories
    if (machineLearning.aestheticMemories?.enabled && machineLearning.aestheticMemories.customCards) {
      for (const card of machineLearning.aestheticMemories.customCards) {
        if (!card.enabled) continue;

        let shouldGenerate = false;
        let takenAfter: DateTime = target;
        
        switch (card.frequency) {
          case 'daily':
            shouldGenerate = true;
            takenAfter = target.minus({ days: 1 });
            break;
          case 'weekly':
            // Generate on Sunday
            shouldGenerate = target.weekday === 7;
            takenAfter = target.minus({ days: 7 });
            break;
          case 'monthly':
            // Generate on the 1st
            shouldGenerate = target.day === 1;
            takenAfter = target.minus({ months: 1 });
            break;
          case 'yearly':
            // Generate on Dec 31
            shouldGenerate = target.month === 12 && target.day === 31;
            takenAfter = target.minus({ years: 1 });
            break;
        }

        if (shouldGenerate) {
          await createMemory(MemoryType.CustomAesthetic, card.title, card.clipPrompt, takenAfter.toJSDate(), targetDate, card.maxPhotos);
        }
      }
    }
  }

  @OnJob({ name: JobName.MemoryCleanup, queue: QueueName.BackgroundTask })
  async onMemoriesCleanup() {
    await this.memoryRepository.cleanup();
  }

  async search(auth: AuthDto, dto: MemorySearchDto) {
    const memories = await this.memoryRepository.search(auth.user.id, dto);
    return memories
      .filter((memory: Memory) => memory.assets && memory.assets.length > 0)
      .map((memory: Memory) => mapMemory(memory, auth));
  }

  statistics(auth: AuthDto, dto: MemorySearchDto) {
    return this.memoryRepository.statistics(auth.user.id, dto);
  }

  async get(auth: AuthDto, id: string): Promise<MemoryResponseDto> {
    await this.requireAccess({ auth, permission: Permission.MemoryRead, ids: [id] });
    const memory = await this.findOrFail(id);
    return mapMemory(memory, auth);
  }

  async create(auth: AuthDto, dto: MemoryCreateDto) {
    // TODO validate type/data combination

    const assetIds = dto.assetIds || [];
    const allowedAssetIds = await this.checkAccess({
      auth,
      permission: Permission.AssetShare,
      ids: assetIds,
    });
    const memory = await this.memoryRepository.create(
      {
        ownerId: auth.user.id,
        type: dto.type,
        data: dto.data,
        isSaved: dto.isSaved,
        memoryAt: dto.memoryAt,
        showAt: dto.showAt,
        hideAt: dto.hideAt,
        seenAt: dto.seenAt,
      },
      allowedAssetIds,
    );

    return mapMemory(memory, auth);
  }

  async update(auth: AuthDto, id: string, dto: MemoryUpdateDto): Promise<MemoryResponseDto> {
    await this.requireAccess({ auth, permission: Permission.MemoryUpdate, ids: [id] });

    const memory = await this.memoryRepository.update(id, {
      isSaved: dto.isSaved,
      memoryAt: dto.memoryAt,
      seenAt: dto.seenAt,
    });

    return mapMemory(memory, auth);
  }

  async remove(auth: AuthDto, id: string): Promise<void> {
    await this.requireAccess({ auth, permission: Permission.MemoryDelete, ids: [id] });
    await this.memoryRepository.delete(id);
  }

  async addAssets(auth: AuthDto, id: string, dto: BulkIdsDto): Promise<BulkIdResponseDto[]> {
    await this.requireAccess({ auth, permission: Permission.MemoryRead, ids: [id] });

    const repos = { access: this.accessRepository, bulk: this.memoryRepository };
    const results = await addAssets(auth, repos, { parentId: id, assetIds: dto.ids });

    const hasSuccess = results.find(({ success }) => success);
    if (hasSuccess) {
      await this.memoryRepository.update(id, { updatedAt: new Date() });
    }

    return results;
  }

  async removeAssets(auth: AuthDto, id: string, dto: BulkIdsDto): Promise<BulkIdResponseDto[]> {
    await this.requireAccess({ auth, permission: Permission.MemoryUpdate, ids: [id] });

    const repos = { access: this.accessRepository, bulk: this.memoryRepository };
    const results = await removeAssets(auth, repos, {
      parentId: id,
      assetIds: dto.ids,
      canAlwaysRemove: Permission.MemoryDelete,
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
