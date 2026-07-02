import { BadRequestException, Injectable } from '@nestjs/common';
import { Insertable } from 'kysely';
import { OnJob } from 'src/decorators';
import { BulkIdResponseDto, BulkIdsDto } from 'src/dtos/asset-ids.response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  mapTag,
  TagBulkAddRemoveAssetsDto,
  TagBulkAddRemoveAssetsResponseDto,
  TagBulkAssetsDto,
  TagBulkAssetsResponseDto,
  TagCreateDto,
  TagResponseDto,
  TagsForAssetsResponseDto,
  TagUpdateDto,
  TagUpsertDto,
} from 'src/dtos/tag.dto';
import { JobName, JobStatus, Permission, QueueName } from 'src/enum';
import { TagAssetTable } from 'src/schema/tables/tag-asset.table';
import { BaseService } from 'src/services/base.service';
import { addAssets, removeAssets } from 'src/utils/asset.util';
import { updateLockedColumns } from 'src/utils/database';
import { upsertTags } from 'src/utils/tag';

@Injectable()
export class TagService extends BaseService {
  async getAll(auth: AuthDto) {
    const tags = await this.tagRepository.getAll(auth.user.id);
    return tags.map((tag) => mapTag(tag));
  }

  async get(auth: AuthDto, id: string): Promise<TagResponseDto> {
    await this.requireAccess({ auth, permission: Permission.TagRead, ids: [id] });
    const tag = await this.findOrFail(id);
    return mapTag(tag);
  }

  async getAllForAssets(auth: AuthDto, assetIds: string[]): Promise<TagsForAssetsResponseDto[]> {
    await this.requireAccess({ auth, permission: Permission.AssetRead, ids: assetIds });
    return await this.tagRepository.getIdsForAssets(assetIds);
  }

  async create(auth: AuthDto, dto: TagCreateDto) {
    let parent;
    if (dto.parentId) {
      await this.requireAccess({ auth, permission: Permission.TagRead, ids: [dto.parentId] });
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
    await this.requireAccess({ auth, permission: Permission.TagUpdate, ids: [id] });

    const { color } = dto;
    const tag = await this.tagRepository.update(id, { color });
    return mapTag(tag);
  }

  async upsert(auth: AuthDto, dto: TagUpsertDto) {
    const tags = await upsertTags(this.tagRepository, { userId: auth.user.id, tags: dto.tags });
    return tags.map((tag) => mapTag(tag));
  }

  async remove(auth: AuthDto, id: string): Promise<void> {
    await this.requireAccess({ auth, permission: Permission.TagDelete, ids: [id] });

    // TODO sync tag changes for affected assets

    await this.tagRepository.delete(id);
  }

  async bulkTagAssets(auth: AuthDto, dto: TagBulkAssetsDto): Promise<TagBulkAssetsResponseDto> {
    const [tagIds, assetIds] = await Promise.all([
      this.checkAccess({ auth, permission: Permission.TagAsset, ids: dto.tagIds }),
      this.checkAccess({ auth, permission: Permission.AssetUpdate, ids: dto.assetIds }),
    ]);

    const results = await this.tagRepository.upsertAssetIds(this.createTagAssetInsertableList(tagIds, assetIds));
    for (const assetId of new Set(results.map((item) => item.assetId))) {
      await this.updateTags(assetId);
      await this.eventRepository.emit('AssetTag', { assetId });
    }

    return { count: results.length };
  }

  async bulkUntagAssets(auth: AuthDto, dto: TagBulkAssetsDto): Promise<TagBulkAssetsResponseDto> {
    const [tagIds, assetIds] = await Promise.all([
      this.checkAccess({ auth, permission: Permission.TagAsset, ids: dto.tagIds }),
      this.checkAccess({ auth, permission: Permission.AssetUpdate, ids: dto.assetIds }),
    ]);

    const results = await this.tagRepository.deleteAssetIds(this.createTagAssetInsertableList(tagIds, assetIds));
    for (const assetId of new Set(results.map((item) => item.assetId))) {
      await this.updateTags(assetId);
      await this.eventRepository.emit('AssetUntag', { assetId });
    }

    return { count: results.length };
  }

  // Add and remove tags from assets in bulk as part of once service, removing potential for race conditions.
  async bulkTagUntagAssets(auth: AuthDto, dto: TagBulkAddRemoveAssetsDto): Promise<TagBulkAddRemoveAssetsResponseDto> {
    const [tagIdsToAdd, tagIdsToRemove, assetIds] = await Promise.all([
      this.checkAccess({ auth, permission: Permission.TagAsset, ids: dto.tagIdsToAdd }),
      this.checkAccess({ auth, permission: Permission.TagAsset, ids: dto.tagIdsToRemove }),
      this.checkAccess({ auth, permission: Permission.AssetUpdate, ids: dto.assetIds }),
    ]);

    const addResults = await this.tagRepository.upsertAssetIds(
      this.createTagAssetInsertableList(tagIdsToAdd, assetIds),
    );
    const removeResults = await this.tagRepository.deleteAssetIds(
      this.createTagAssetInsertableList(tagIdsToRemove, assetIds),
    );

    for (const assetId of new Set([...addResults, ...removeResults].map((item) => item.assetId))) {
      await this.updateTags(assetId);
      // AssetTag and AssetUntag events perform the same function, and we only want one event to be emitted for each asset
      // to avoid sidecar file clashes, so we can emit AssetTag for all changes.
      await this.eventRepository.emit('AssetTag', { assetId });
    }

    return { addedCount: addResults.length, removedCount: removeResults.length };
  }

  async addAssets(auth: AuthDto, id: string, dto: BulkIdsDto): Promise<BulkIdResponseDto[]> {
    await this.requireAccess({ auth, permission: Permission.TagAsset, ids: [id] });

    const results = await addAssets(
      auth,
      { access: this.accessRepository, bulk: this.tagRepository },
      { parentId: id, assetIds: dto.ids },
    );

    for (const { id: assetId, success } of results) {
      if (success) {
        await this.updateTags(assetId);
        await this.eventRepository.emit('AssetTag', { assetId });
      }
    }

    return results;
  }

  async removeAssets(auth: AuthDto, id: string, dto: BulkIdsDto): Promise<BulkIdResponseDto[]> {
    await this.requireAccess({ auth, permission: Permission.TagAsset, ids: [id] });

    const results = await removeAssets(
      auth,
      { access: this.accessRepository, bulk: this.tagRepository },
      { parentId: id, assetIds: dto.ids, canAlwaysRemove: Permission.TagDelete },
    );

    for (const { id: assetId, success } of results) {
      if (success) {
        await this.updateTags(assetId);
        await this.eventRepository.emit('AssetUntag', { assetId });
      }
    }

    return results;
  }

  @OnJob({ name: JobName.TagCleanup, queue: QueueName.BackgroundTask })
  async handleTagCleanup() {
    await this.tagRepository.deleteEmptyTags();
    return JobStatus.Success;
  }

  private async findOrFail(id: string) {
    const tag = await this.tagRepository.get(id);
    if (!tag) {
      throw new BadRequestException('Tag not found');
    }
    return tag;
  }

  private async updateTags(assetId: string) {
    const { tags } = await this.assetRepository.getForUpdateTags(assetId);
    await this.assetRepository.upsertExif({
      exif: updateLockedColumns({ assetId, tags: tags.map(({ value }) => value) }),
      lockedPropertiesBehavior: 'append',
    });
  }

  private createTagAssetInsertableList(tagIds: Set<string>, assetIds: Set<string>): Insertable<TagAssetTable>[] {
    const items: Insertable<TagAssetTable>[] = [];
    for (const tagId of tagIds) {
      for (const assetId of assetIds) {
        items.push({ tagId, assetId });
      }
    }
    return items;
  }
}
