import { BadRequestException, Injectable } from '@nestjs/common';
import { BulkIdResponseDto, BulkIdsDto } from 'src/dtos/asset-ids.response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { MemoryCreateDto, MemoryResponseDto, MemoryUpdateDto, mapMemory } from 'src/dtos/memory.dto';
import { AssetEntity } from 'src/entities/asset.entity';
import { Permission } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { addAssets, removeAssets } from 'src/utils/asset.util';

@Injectable()
export class MemoryService extends BaseService {
  async search(auth: AuthDto) {
    const memories = await this.memoryRepository.search(auth.user.id);
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
    const memory = await this.memoryRepository.create({
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
    await this.requireAccess({ auth, permission: Permission.MEMORY_UPDATE, ids: [id] });

    const memory = await this.memoryRepository.update({
      id,
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
      await this.memoryRepository.update({ id, updatedAt: new Date() });
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
      await this.memoryRepository.update({ id, updatedAt: new Date() });
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
