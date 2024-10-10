import { BadRequestException, Injectable } from '@nestjs/common';
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
import { TagEntity } from 'src/entities/tag.entity';
import { Permission } from 'src/enum';
import { JobStatus } from 'src/interfaces/job.interface';
import { AssetTagItem } from 'src/interfaces/tag.interface';
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
    let parent: TagEntity | undefined;
    if (dto.parentId) {
      await this.requireAccess({ auth, permission: Permission.TAG_READ, ids: [dto.parentId] });
      parent = (await this.tagRepository.get(dto.parentId)) || undefined;
      if (!parent) {
        throw new BadRequestException('Tag not found');
      }
    }

    const userId = auth.user.id;
    const value = parent ? `${parent.value}/${dto.name}` : dto.name;
    const duplicate = await this.tagRepository.getByValue(userId, value);
    if (duplicate) {
      throw new BadRequestException(`A tag with that name already exists`);
    }

    const tag = await this.tagRepository.create({ userId, value, parent });

    return mapTag(tag);
  }

  async update(auth: AuthDto, id: string, dto: TagUpdateDto): Promise<TagResponseDto> {
    await this.requireAccess({ auth, permission: Permission.TAG_UPDATE, ids: [id] });

    const { color } = dto;
    const tag = await this.tagRepository.update({ id, color });
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

    const items: AssetTagItem[] = [];
    for (const tagId of tagIds) {
      for (const assetId of assetIds) {
        items.push({ tagId, assetId });
      }
    }

    const results = await this.tagRepository.upsertAssetIds(items);
    for (const assetId of new Set(results.map((item) => item.assetId))) {
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

  async handleTagCleanup() {
    await this.tagRepository.deleteEmptyTags();
    return JobStatus.SUCCESS;
  }

  private async findOrFail(id: string) {
    const tag = await this.tagRepository.get(id);
    if (!tag) {
      throw new BadRequestException('Tag not found');
    }
    return tag;
  }
}
