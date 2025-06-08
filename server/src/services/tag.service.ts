import { BadRequestException, Injectable } from '@nestjs/common';
import { Insertable } from 'kysely';
import { TagAsset } from 'src/db';
import { OnJob } from 'src/decorators';
import { BulkIdResponseDto, BulkIdsDto } from 'src/dtos/asset-ids.response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  TagBulkAssetsDto,
  TagBulkAssetsResponseDto,
  TagCreateDto,
  TagResponseDto,
  TagUpdateDto,
  TagUpsertDto,
  mapTag,
} from 'src/dtos/tag.dto';
import { JobName, JobStatus, Permission, QueueName } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { addAssets, removeAssets } from 'src/utils/asset.util';
import { upsertTags } from 'src/utils/tag';

@Injectable()
export class TagService extends BaseService {
  async getAll(auth: AuthDto) {
    const tags = await this.tagRepository.getAll(auth.user.id);
    return tags.map((tag) => mapTag(tag));
  }

  async get(auth: AuthDto, id: string): Promise<TagResponseDto> {
    await this.requireAccess({ auth, permission: Permission.TAG_READ, ids: [id] });
    const tag = await this.findOrFail(id);
    return mapTag(tag);
  }

  async create(auth: AuthDto, dto: TagCreateDto) {
    const parent = await this.findParent(auth, dto.parentId);
    const userId = auth.user.id;

    const { name, color } = dto;

    if (name.includes('/')) {
      throw new BadRequestException(`Tag name cannot contain slash characters ("/")`);
    }

    const value = parent ? `${parent.value}/${name}` : name;
    const duplicate = await this.tagRepository.getByValue(userId, value);
    if (duplicate) {
      throw new BadRequestException(`A tag with that name already exists`);
    }

    const tag = await this.tagRepository.create({ userId, value, color, parentId: parent?.id });

    return mapTag(tag);
  }

  async update(auth: AuthDto, id: string, dto: TagUpdateDto): Promise<TagResponseDto> {
    await this.requireAccess({ auth, permission: Permission.TAG_UPDATE, ids: [id] });

    const { name, color } = dto;

    if (name?.includes('/')) {
      throw new BadRequestException(`Tag name cannot contain slash characters ("/")`);
    }

    const existing = await this.tagRepository.getOne(id);
    if (!existing) {
      throw new BadRequestException(`Tag not found with id: ${id}`);
    }

    let value;
    if (name) {
      const parts = existing.value.split('/');
      parts[parts.length - 1] = name;
      value = parts.join('/');
    }

    const tag = await this.tagRepository.update(id, { value, color });
    return mapTag(tag);
  }

  async upsert(auth: AuthDto, dto: TagUpsertDto) {
    const tags = await upsertTags(this.tagRepository, { userId: auth.user.id, tags: dto.tags });
    return tags.map((tag) => mapTag(tag));
  }

  async remove(auth: AuthDto, id: string): Promise<void> {
    await this.requireAccess({ auth, permission: Permission.TAG_DELETE, ids: [id] });

    // TODO sync tag changes for affected assets

    await this.tagRepository.delete(id);
  }

  async bulkTagAssets(auth: AuthDto, dto: TagBulkAssetsDto): Promise<TagBulkAssetsResponseDto> {
    const [tagIds, assetIds] = await Promise.all([
      this.checkAccess({ auth, permission: Permission.TAG_ASSET, ids: dto.tagIds }),
      this.checkAccess({ auth, permission: Permission.ASSET_UPDATE, ids: dto.assetIds }),
    ]);

    const items: Insertable<TagAsset>[] = [];
    for (const tagsId of tagIds) {
      for (const assetsId of assetIds) {
        items.push({ tagsId, assetsId });
      }
    }

    const results = await this.tagRepository.upsertAssetIds(items);
    for (const assetId of new Set(results.map((item) => item.assetsId))) {
      await this.eventRepository.emit('asset.tag', { assetId });
    }

    return { count: results.length };
  }

  async addAssets(auth: AuthDto, id: string, dto: BulkIdsDto): Promise<BulkIdResponseDto[]> {
    await this.requireAccess({ auth, permission: Permission.TAG_ASSET, ids: [id] });

    const results = await addAssets(
      auth,
      { access: this.accessRepository, bulk: this.tagRepository },
      { parentId: id, assetIds: dto.ids },
    );

    for (const { id: assetId, success } of results) {
      if (success) {
        await this.eventRepository.emit('asset.tag', { assetId });
      }
    }

    return results;
  }

  async removeAssets(auth: AuthDto, id: string, dto: BulkIdsDto): Promise<BulkIdResponseDto[]> {
    await this.requireAccess({ auth, permission: Permission.TAG_ASSET, ids: [id] });

    const results = await removeAssets(
      auth,
      { access: this.accessRepository, bulk: this.tagRepository },
      { parentId: id, assetIds: dto.ids, canAlwaysRemove: Permission.TAG_DELETE },
    );

    for (const { id: assetId, success } of results) {
      if (success) {
        await this.eventRepository.emit('asset.untag', { assetId });
      }
    }

    return results;
  }

  @OnJob({ name: JobName.TAG_CLEANUP, queue: QueueName.BACKGROUND_TASK })
  async handleTagCleanup() {
    await this.tagRepository.deleteEmptyTags();
    return JobStatus.SUCCESS;
  }

  private async findOrFail(id: string) {
    const tag = await this.tagRepository.getOne(id);
    if (!tag) {
      throw new BadRequestException('Tag not found');
    }
    return tag;
  }

  private async findParent(auth: AuthDto, parentId?: string | null) {
    if (parentId) {
      await this.requireAccess({ auth, permission: Permission.TAG_READ, ids: [parentId] });
      const parent = await this.tagRepository.getOne(parentId);
      if (!parent) {
        throw new BadRequestException('Tag not found');
      }
      return parent;
    }
  }
}
