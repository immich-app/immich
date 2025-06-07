import { BadRequestException, Injectable } from '@nestjs/common';
import { Insertable } from 'kysely';
import { Tag } from 'src/database';
import { TagAsset } from 'src/db'; // Assuming TagEntity is the type returned by repository
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


   /**
   * Return all tags the user owns plus tags on assets in albums shared with them.
   */
  async getAll(auth: AuthDto): Promise<TagResponseDto[]> {
    const userId = auth.user.id;
    const ownTags = await this.tagRepository.getAll(userId);
    const sharedAlbums = await this.albumRepository.getShared(userId);
    const assetIds = sharedAlbums.flatMap(album =>
      album.assets.map((asset: { id: string }) => asset.id),
    );
    const sharedTags = assetIds.length > 0
      ? await this.tagRepository.getByAssetIds(assetIds)
      : [];
    const merged = [...ownTags, ...sharedTags];
    const uniqueById = Array.from(new Map(merged.map(t => [t.id, t])).values());
    return uniqueById
      .map(t => t as unknown as Tag)
      .map(tag => mapTag(tag));
  }
  
  async get(auth: AuthDto, id: string): Promise<TagResponseDto> {
    await this.requireAccess({ auth, permission: Permission.TAG_READ, ids: [id] });
    const tag = await this.findOrFail(id);
    return mapTag(tag);
  }

  async create(auth: AuthDto, dto: TagCreateDto) {
    let parent;
    if (dto.parentId) {
      await this.requireAccess({ auth, permission: Permission.TAG_READ, ids: [dto.parentId] });
      parent = await this.tagRepository.get(dto.parentId);
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

    const { color } = dto;
    const tag = await this.tagRepository.create({ userId, value, color, parentId: parent?.id });

    return mapTag(tag);
  }

  async update(auth: AuthDto, id: string, dto: TagUpdateDto): Promise<TagResponseDto> {
    await this.requireAccess({ auth, permission: Permission.TAG_UPDATE, ids: [id] });

    const { color } = dto;
    const tag = await this.tagRepository.update(id, { color });
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
    const tag = await this.tagRepository.get(id);
    if (!tag) {
      throw new BadRequestException('Tag not found');
    }
    return tag;
  }
}
