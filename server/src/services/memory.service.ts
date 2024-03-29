import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { AccessCore, Permission } from 'src/cores/access.core';
import { BulkIdErrorReason, BulkIdResponseDto, BulkIdsDto } from 'src/dtos/asset-ids.response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { MemoryCreateDto, MemoryResponseDto, MemoryUpdateDto, mapMemory } from 'src/dtos/memory.dto';
import { AssetEntity } from 'src/entities/asset.entity';
import { IAccessRepository } from 'src/interfaces/access.interface';
import { IMemoryRepository } from 'src/interfaces/memory.interface';

@Injectable()
export class MemoryService {
  private access: AccessCore;

  constructor(
    @Inject(IAccessRepository) accessRepository: IAccessRepository,
    @Inject(IMemoryRepository) private repository: IMemoryRepository,
  ) {
    this.access = AccessCore.create(accessRepository);
  }

  async search(auth: AuthDto) {
    const memories = await this.repository.search(auth.user.id);
    return memories.map((memory) => mapMemory(memory));
  }

  async get(auth: AuthDto, id: string): Promise<MemoryResponseDto> {
    await this.access.requirePermission(auth, Permission.MEMORY_READ, id);
    const memory = await this.findOrFail(id);
    return mapMemory(memory);
  }

  async create(auth: AuthDto, dto: MemoryCreateDto) {
    // TODO validate type/data combination

    const assetIds = dto.assetIds || [];
    const allowedAssetIds = await this.access.checkAccess(auth, Permission.ASSET_SHARE, assetIds);
    const memory = await this.repository.create({
      ownerId: auth.user.id,
      type: dto.type,
      data: dto.data,
      isSaved: dto.isSaved,
      memoryAt: dto.memoryAt,
      seenAt: dto.seenAt,
      assets: [...allowedAssetIds].map((id) => ({ id }) as AssetEntity),
    });

    return mapMemory(memory);
  }

  async update(auth: AuthDto, id: string, dto: MemoryUpdateDto): Promise<MemoryResponseDto> {
    await this.access.requirePermission(auth, Permission.MEMORY_WRITE, id);

    const memory = await this.repository.update({
      id,
      isSaved: dto.isSaved,
      memoryAt: dto.memoryAt,
      seenAt: dto.seenAt,
    });

    return mapMemory(memory);
  }

  async remove(auth: AuthDto, id: string): Promise<void> {
    await this.access.requirePermission(auth, Permission.MEMORY_DELETE, id);
    await this.repository.delete(id);
  }

  async addAssets(auth: AuthDto, id: string, dto: BulkIdsDto): Promise<BulkIdResponseDto[]> {
    await this.access.requirePermission(auth, Permission.MEMORY_READ, id);

    // TODO move this to AssetCore
    const existingAssetIds = await this.repository.getAssetIds(id, dto.ids);
    const notPresentAssetIds = dto.ids.filter((id) => !existingAssetIds.has(id));
    const allowedAssetIds = await this.access.checkAccess(auth, Permission.ASSET_SHARE, notPresentAssetIds);

    const results: BulkIdResponseDto[] = [];
    for (const assetId of dto.ids) {
      const hasAsset = existingAssetIds.has(assetId);
      if (hasAsset) {
        results.push({ id: assetId, success: false, error: BulkIdErrorReason.DUPLICATE });
        continue;
      }

      const hasAccess = allowedAssetIds.has(assetId);
      if (!hasAccess) {
        results.push({ id: assetId, success: false, error: BulkIdErrorReason.NO_PERMISSION });
        continue;
      }

      results.push({ id: assetId, success: true });
    }

    const newAssetIds = results.filter(({ success }) => success).map(({ id }) => id);
    if (newAssetIds.length > 0) {
      await this.repository.addAssetIds(id, newAssetIds);
      await this.repository.update({ id, updatedAt: new Date() });
    }

    return results;
  }

  async removeAssets(auth: AuthDto, id: string, dto: BulkIdsDto): Promise<BulkIdResponseDto[]> {
    await this.access.requirePermission(auth, Permission.MEMORY_WRITE, id);

    const existingAssetIds = await this.repository.getAssetIds(id, dto.ids);
    const presentAssetIds = new Set(dto.ids.filter((id) => existingAssetIds.has(id)));
    const allowedAssetIds = await this.access.checkAccess(auth, Permission.ASSET_SHARE, presentAssetIds);

    const results: BulkIdResponseDto[] = [];
    for (const assetId of dto.ids) {
      const hasAsset = existingAssetIds.has(assetId);
      if (!hasAsset) {
        results.push({ id: assetId, success: false, error: BulkIdErrorReason.NOT_FOUND });
        continue;
      }

      const hasAccess = allowedAssetIds.has(assetId);
      if (!hasAccess) {
        results.push({ id: assetId, success: false, error: BulkIdErrorReason.NO_PERMISSION });
        continue;
      }

      results.push({ id: assetId, success: true });
    }

    const removedIds = results.filter(({ success }) => success).map(({ id }) => id);
    if (removedIds.length > 0) {
      await this.repository.removeAssetIds(id, removedIds);
      await this.repository.update({ id, updatedAt: new Date() });
    }

    return results;
  }

  private async findOrFail(id: string) {
    const memory = await this.repository.get(id);
    if (!memory) {
      throw new BadRequestException('Memory not found');
    }
    return memory;
  }
}
