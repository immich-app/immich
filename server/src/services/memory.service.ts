import { BadRequestException, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { OnJob } from 'src/decorators';
import { BulkIdResponseDto, BulkIdsDto } from 'src/dtos/asset-ids.response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { MemoryCreateDto, MemoryResponseDto, MemorySearchDto, MemoryUpdateDto, mapMemory } from 'src/dtos/memory.dto';
import { DatabaseLock, JobName, MemoryType, Permission, QueueName, SystemMetadataKey } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { addAssets, getMyPartnerIds, removeAssets } from 'src/utils/asset.util';

const DAYS = 3;
const SIMILARITY_THRESHOLD = 0.6; // Threshold for grouping similar images
const MIN_ASSETS_PER_MEMORY = 3; // Minimum assets to create a memory
const MAX_ASSETS_PER_MEMORY = 30; // Maximum assets per memory group
const DATE_WINDOW_EXPANSION = 2; // Max days to expand window (±2 days)
const DEDUP_WINDOW_DAYS = 7; // Don't show same photos within this window

@Injectable()
export class MemoryService extends BaseService {
  @OnJob({ name: JobName.MemoryGenerate, queue: QueueName.BackgroundTask })
  async onMemoriesCreate() {
    const users = await this.userRepository.getList({ withDeleted: false });
    const usersIds = await Promise.all(
      users.map((user) =>
        getMyPartnerIds({
          userId: user.id,
          repository: this.partnerRepository,
          timelineEnabled: true,
        }),
      ),
    );

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

        try {
          await Promise.all(users.map((owner, i) => this.createOnThisDayMemories(owner.id, usersIds[i], target)));
        } catch (error) {
          this.logger.error(`Failed to create memories for ${target.toISO()}`, error);
        }
        // update system metadata even when there is an error to minimize the chance of duplicates
        await this.systemMetadataRepository.set(SystemMetadataKey.MemoriesState, {
          ...state,
          lastOnThisDayDate: target.toISO(),
        });
      }
    });
  }

  private async createOnThisDayMemories(ownerId: string, userIds: string[], target: DateTime) {
    const showAt = target.startOf('day').toISO();
    const hideAt = target.endOf('day').toISO();
    
    // Check if smart search is enabled
    const config = await this.systemMetadataRepository.get(SystemMetadataKey.SystemConfig);
    const isSmartSearchEnabled = config?.machineLearning?.enabled && config?.machineLearning?.clip?.enabled;
    
    // Get memories for the exact day first
    const memories = await this.assetRepository.getByDayOfYear([ownerId, ...userIds], target);
    
    // If smart search is enabled, try to expand date window for more photos
    if (isSmartSearchEnabled) {
      const yearlyAssets: { year: number; assets: any[] }[] = [];
      
      for (const { year, assets } of memories) {
        let expandedAssets = assets;
        let dayRange = 0;
        
        // Expand date window if we don't have enough photos
        while (expandedAssets.length < MIN_ASSETS_PER_MEMORY * 2 && dayRange < DATE_WINDOW_EXPANSION) {
          dayRange++;
          
          // This is a simplified approach - in production, you'd want a more efficient query
          const extraAssets: any[] = [];
          for (let d = 1; d <= dayRange; d++) {
            const beforeAssets = await this.assetRepository.getByDayOfYear(
              [ownerId, ...userIds], 
              target.minus({ days: d })
            );
            const afterAssets = await this.assetRepository.getByDayOfYear(
              [ownerId, ...userIds], 
              target.plus({ days: d })
            );
            
            // Add assets from the same year
            for (const m of beforeAssets) {
              if (m.year === year) {
                extraAssets.push(...m.assets);
              }
            }
            for (const m of afterAssets) {
              if (m.year === year) {
                extraAssets.push(...m.assets);
              }
            }
          }
          
          expandedAssets = [...assets, ...extraAssets];
        }
        
        yearlyAssets.push({ year, assets: expandedAssets });
      }
      
      // Process each year's assets
      for (const { year, assets } of yearlyAssets) {
        // Always create traditional memory first (fallback)
        const traditionalMemory = await this.memoryRepository.create(
          {
            ownerId,
            type: MemoryType.OnThisDay,
            data: { year },
            memoryAt: target.set({ year }).toISO()!,
            showAt,
            hideAt,
          },
          new Set(assets.map(({ id }) => id)),
        );
        
        // Try to create smart memories if we have enough assets
        if (assets.length >= MIN_ASSETS_PER_MEMORY) {
          const smartMemoriesCreated = await this.createSmartMemories(
            ownerId, 
            assets, 
            year, 
            target, 
            showAt, 
            hideAt
          );
          
          // If smart memories were created, we can optionally remove the traditional one
          // to avoid duplication (uncomment if desired)
          // if (smartMemoriesCreated > 0) {
          //   await this.memoryRepository.delete(traditionalMemory.id);
          // }
        }
      }
    } else {
      // No smart search - just create traditional memories
      await Promise.all(
        memories.map(async ({ year, assets }) => {
          await this.memoryRepository.create(
            {
              ownerId,
              type: MemoryType.OnThisDay,
              data: { year },
              memoryAt: target.set({ year }).toISO()!,
              showAt,
              hideAt,
            },
            new Set(assets.map(({ id }) => id)),
          );
        }),
      );
    }
  }

  private async createSmartMemories(
    ownerId: string,
    assets: any[],
    year: number,
    target: DateTime,
    showAt: string | null,
    hideAt: string | null,
  ): Promise<number> {
    let memoriesCreated = 0;
    
    try {
      // Filter assets that have embeddings by checking one by one
      const assetsWithEmbeddings = [];
      for (const asset of assets) {
        const assetWithEmbedding = await this.assetJobRepository.getForSearchDuplicatesJob(asset.id);
        if (assetWithEmbedding?.embedding) {
          assetsWithEmbeddings.push({
            ...asset,
            embedding: assetWithEmbedding.embedding,
            type: assetWithEmbedding.type,
          });
        }
      }
      
      if (assetsWithEmbeddings.length < MIN_ASSETS_PER_MEMORY) {
        return 0;
      }

      // Group assets by similarity
      const groups = await this.groupAssetsBySimilarity(assetsWithEmbeddings);
      
      // Check for recent memories to avoid duplication
      const cutoffDate = DateTime.now().minus({ days: DEDUP_WINDOW_DAYS });
      const allMemories = await this.memoryRepository.search(ownerId, {});
      
      // Filter to get recent smart memories
      const recentMemories = allMemories.filter(memory => {
        if (memory.type !== MemoryType.SmartOnThisDay) {
          return false;
        }
        if (!memory.createdAt) {
          return false;
        }
        const memoryDate = DateTime.fromJSDate(memory.createdAt);
        return memoryDate >= cutoffDate;
      });
      
      // Get recently used asset IDs
      const recentlyUsedAssets = new Set<string>();
      for (const memory of recentMemories) {
        if (memory.assets) {
          for (const asset of memory.assets) {
            recentlyUsedAssets.add(asset.id);
          }
        }
      }
      
      // Create a memory for each group
      let groupIndex = 0;
      for (const group of groups) {
        if (group.length >= MIN_ASSETS_PER_MEMORY) {
          // Check if most of the photos in this group were recently used
          const recentlyUsedCount = group.filter(asset => recentlyUsedAssets.has(asset.id)).length;
          const recentlyUsedPercentage = recentlyUsedCount / group.length;
          
          // Skip if more than 70% of photos were recently shown
          if (recentlyUsedPercentage > 0.7) {
            this.logger.debug(`Skipping memory group ${groupIndex} - ${Math.round(recentlyUsedPercentage * 100)}% of photos recently shown`);
            continue;
          }
          
          await this.memoryRepository.create(
            {
              ownerId,
              type: MemoryType.SmartOnThisDay,
              data: { 
                year,
                groupIndex: groupIndex++,
                groupSize: group.length,
                theme: `Memory ${groupIndex}`, // Could be enhanced with AI-generated titles
                dateWindow: `${target.minus({ days: 2 }).toISODate()}_${target.plus({ days: 2 }).toISODate()}`
              },
              memoryAt: target.set({ year }).toISO()!,
              showAt,
              hideAt,
            },
            new Set(group.map(({ id }) => id)),
          );
          
          memoriesCreated++;
        }
      }
      
      return memoriesCreated;
    } catch (error) {
      this.logger.error(`Failed to create smart memories: ${error}`);
      return 0;
    }
  }

  private async groupAssetsBySimilarity(assetsWithEmbeddings: any[]): Promise<any[][]> {
    const groups: any[][] = [];
    const used = new Set<string>();
    
    for (const asset of assetsWithEmbeddings) {
      if (used.has(asset.id) || !asset.embedding) {
        continue;
      }
      
      const group = [asset];
      used.add(asset.id);
      
      // Find similar assets
      const similarities = await this.findSimilarAssets(asset, assetsWithEmbeddings, used);
      group.push(...similarities);
      
      if (group.length >= MIN_ASSETS_PER_MEMORY) {
        groups.push(group.slice(0, MAX_ASSETS_PER_MEMORY));
      }
    }
    
    return groups;
  }

  private async findSimilarAssets(
    targetAsset: any,
    allAssets: any[],
    used: Set<string>,
  ): Promise<any[]> {
    const similar: any[] = [];
    
    if (!targetAsset.embedding) {
      return similar;
    }
    
    // Search for similar assets using the duplicate repository logic
    const searchResults = await this.duplicateRepository.search({
      assetId: targetAsset.id,
      embedding: targetAsset.embedding,
      maxDistance: SIMILARITY_THRESHOLD,
      type: targetAsset.type,
      userIds: [targetAsset.ownerId],
    });
    
    // Filter to only include assets from our set
    const assetIdSet = new Set(allAssets.map(a => a.id));
    for (const result of searchResults) {
      if (!used.has(result.assetId) && assetIdSet.has(result.assetId)) {
        const asset = allAssets.find(a => a.id === result.assetId);
        if (asset) {
          similar.push(asset);
          used.add(result.assetId);
        }
      }
    }
    
    return similar;
  }

  @OnJob({ name: JobName.MemoryCleanup, queue: QueueName.BackgroundTask })
  async onMemoriesCleanup() {
    await this.memoryRepository.cleanup();
  }

  async search(auth: AuthDto, dto: MemorySearchDto) {
    const memories = await this.memoryRepository.search(auth.user.id, dto);
    return memories.map((memory) => mapMemory(memory, auth));
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
