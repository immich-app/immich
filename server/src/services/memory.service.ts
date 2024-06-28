import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { AccessCore, Permission } from 'src/cores/access.core';
import { BulkIdResponseDto, BulkIdsDto } from 'src/dtos/asset-ids.response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { MemoryCreateDto, MemoryResponseDto, MemoryUpdateDto, mapMemory } from 'src/dtos/memory.dto';
import { AssetEntity } from 'src/entities/asset.entity';
import { IAccessRepository } from 'src/interfaces/access.interface';
import { IMemoryRepository } from 'src/interfaces/memory.interface';
import { addAssets, removeAssets } from 'src/utils/asset.util';

@Injectable()
export class MemoryService {
  private access: AccessCore;

  constructor(
    @Inject(IAccessRepository) private accessRepository: IAccessRepository,
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

    const repos = { accessRepository: this.accessRepository, repository: this.repository };
    const results = await addAssets(auth, repos, { parentId: id, assetIds: dto.ids });

    const hasSuccess = results.find(({ success }) => success);
    if (hasSuccess) {
      await this.repository.update({ id, updatedAt: new Date() });
    }

    return results;
  }

  async removeAssets(auth: AuthDto, id: string, dto: BulkIdsDto): Promise<BulkIdResponseDto[]> {
    await this.access.requirePermission(auth, Permission.MEMORY_WRITE, id);

    const repos = { accessRepository: this.accessRepository, repository: this.repository };
    const results = await removeAssets(auth, repos, {
      parentId: id,
      assetIds: dto.ids,
      canAlwaysRemove: Permission.MEMORY_DELETE,
    });

    const hasSuccess = results.find(({ success }) => success);
    if (hasSuccess) {
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
