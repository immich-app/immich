import { BadRequestException, Injectable } from '@nestjs/common';
import { Insertable } from 'kysely';
import { OnEvent, OnJob } from 'src/decorators.js';
import { BulkIdErrorReason, BulkIdResponseDto, BulkIdsDto } from 'src/dtos/asset-ids.response.dto.js';
import { AuthDto } from 'src/dtos/auth.dto.js';
import {
  TagBulkAssetsDto,
  TagBulkAssetsResponseDto,
  TagCreateDto,
  TagResponseDto,
  TagUpdateDto,
  TagUpsertDto,
  mapTag,
} from 'src/dtos/tag.dto.js';
import { JobName, JobStatus, Permission, QueueName } from 'src/enum.js';
import type { ArgOf } from 'src/repositories/event.repository.js';
import { Resource } from 'src/resource-paths.js';
import { TagAssetTable } from 'src/schema/tables/tag-asset.table.js';
import { BaseService } from 'src/services/base.service.js';
import { checkAccess, requireAccess, requireElevatedPermission } from 'src/utils/access.js';
import { writeAssetTagsToExif } from 'src/utils/asset.util.js';
import { findOrFail } from 'src/utils/misc.js';
import { tagPaths, upsertTags } from 'src/utils/tag.js';

@Injectable()
export class TagService extends BaseService {
  @OnEvent({ name: 'UserCreate' })
  async onUserCreate({ id }: Pick<ArgOf<'UserCreate'>, 'id'>) {
    await this.tagRepository.getOrCreateSystemTag({
      userId: id,
      value: 'locked',
      systemKey: 'locked',
      isPrivate: true,
    });
  }

  async getAll(auth: AuthDto) {
    const tags = await this.tagRepository.getAll(auth.user.id, {
      includePrivate: auth.session?.hasElevatedPermission === true,
    });
    return tags.map((tag) => mapTag(tag));
  }

  async get(auth: AuthDto, id: string): Promise<TagResponseDto> {
    await this.requireAccess({ auth, permission: Permission.TagRead, ids: [id] });
    const tag = await this.findOrFail(id);
    return mapTag(tag);
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
    if (dto.isPrivate || parent?.isPrivate) {
      requireElevatedPermission(auth);
    }

    const duplicate = await this.tagRepository.getByValue(userId, value);
    if (duplicate) {
      throw new BadRequestException('Tag name is unavailable');
    }

    const { color } = dto;
    const { isPrivate } = dto;
    const tag = await this.tagRepository.create({ userId, value, color, parentId: parent?.id, isPrivate });
    this.resourceRepository.send({ userIds: [userId], changed: [Resource.tags()] });

    return mapTag(tag);
  }

  async update(auth: AuthDto, id: string, dto: TagUpdateDto): Promise<TagResponseDto> {
    await this.requireAccess({ auth, permission: Permission.TagUpdate, ids: [id] });

    const { name, color, isPrivate } = dto;
    const existing = await this.findOrFail(id);

    if (existing.systemKey && isPrivate === false) {
      throw new BadRequestException('A system private tag cannot be made public');
    }

    const privacyChanged = isPrivate !== undefined && isPrivate !== existing.isPrivate;
    if (privacyChanged) {
      requireElevatedPermission(auth);
    }

    let value;
    if (name) {
      const parts = existing.value.split('/');
      parts[parts.length - 1] = name;
      value = parts.join('/');
    } else {
      value = existing.value;
    }

    const result = await this.tagRepository.update(id, {
      value,
      color,
      ...(privacyChanged && { isPrivate }),
    });
    if (result.error === 'hasAssets') {
      throw new BadRequestException('Cannot make a private tag public while it has assets');
    }

    if (!this.notifyAssetPrivacy(result.privacyUserIds)) {
      this.resourceRepository.send({ userIds: [auth.user.id], changed: [Resource.tag({ id })] });
    }
    await this.syncAssetTags(result.assetIds);

    return mapTag(result.tag);
  }

  async upsert(auth: AuthDto, dto: TagUpsertDto) {
    if (
      !auth.session?.hasElevatedPermission &&
      (await this.tagRepository.hasPrivatePath(auth.user.id, tagPaths(dto.tags)))
    ) {
      throw new BadRequestException('Not found or no tag.create access');
    }
    const tags = await upsertTags(this.tagRepository, { userId: auth.user.id, tags: dto.tags });
    if (tags.length > 0) {
      this.resourceRepository.send({ userIds: [auth.user.id], changed: [Resource.tags()] });
    }

    return tags.map((tag) => mapTag(tag));
  }

  async remove(auth: AuthDto, id: string): Promise<void> {
    await this.requireAccess({ auth, permission: Permission.TagDelete, ids: [id] });
    const result = await this.tagRepository.delete(id, auth.session?.hasElevatedPermission === true);
    if (result.error) {
      if (result.error === 'private') {
        requireElevatedPermission(auth);
      }
      throw new BadRequestException('Cannot delete a private tag while it has assets');
    }

    this.resourceRepository.send({ userIds: [auth.user.id], deleted: [Resource.tag({ id })] });
    await this.syncAssetTags(result.assetIds);
  }

  async bulkTagAssets(auth: AuthDto, dto: TagBulkAssetsDto): Promise<TagBulkAssetsResponseDto> {
    const permittedTagIds = [...(await this.checkAccess({ auth, permission: Permission.TagAsset, ids: dto.tagIds }))];
    const { result, privacyUserIds } = await this.tagRepository.changeAssetLinks(
      auth.user.id,
      permittedTagIds,
      async (bulk, access) => {
        const [tagIds, assetIds] = await Promise.all([
          checkAccess(access, { auth, permission: Permission.TagAsset, ids: permittedTagIds }),
          checkAccess(access, { auth, permission: Permission.AssetUpdate, ids: dto.assetIds }),
        ]);

        const items: Insertable<TagAssetTable>[] = [];
        for (const tagId of tagIds) {
          for (const assetId of assetIds) {
            items.push({ tagId, assetId });
          }
        }

        const links = await bulk.upsertAssetIds(items);
        return { result: links, links };
      },
    );

    if (result.length > 0 && !this.notifyAssetPrivacy(privacyUserIds)) {
      this.resourceRepository.send({ userIds: [auth.user.id], changed: [Resource.tags()] });
    }

    for (const assetId of new Set(result.map((item) => item.assetId))) {
      await writeAssetTagsToExif(this.assetRepository, assetId);
      await this.eventRepository.emit('AssetTag', { assetId, userId: auth.user.id });
    }

    return { count: result.length };
  }

  addAssets(auth: AuthDto, id: string, dto: BulkIdsDto): Promise<BulkIdResponseDto[]> {
    return this.changeAssets(auth, id, dto.ids, 'add');
  }

  removeAssets(auth: AuthDto, id: string, dto: BulkIdsDto): Promise<BulkIdResponseDto[]> {
    return this.changeAssets(auth, id, dto.ids, 'remove');
  }

  private async changeAssets(auth: AuthDto, id: string, assetIds: string[], action: 'add' | 'remove') {
    await this.requireAccess({ auth, permission: Permission.TagAsset, ids: [id] });
    const { result, privacyUserIds } = await this.tagRepository.changeAssetLinks(
      auth.user.id,
      [id],
      async (bulk, access) => {
        await requireAccess(access, { auth, permission: Permission.TagAsset, ids: [id] });
        const allowedIds = await checkAccess(access, { auth, permission: Permission.AssetUpdate, ids: assetIds });
        const adding = action === 'add';
        const links =
          allowedIds.size === 0
            ? []
            : adding
              ? await bulk.upsertAssetIds([...allowedIds].sort().map((assetId) => ({ tagId: id, assetId })))
              : await bulk.removeAssetIds(id, [...allowedIds]);
        const changedIds = new Set(links.map(({ assetId }) => assetId));
        const result = assetIds.map((assetId): BulkIdResponseDto => {
          const error = allowedIds.has(assetId)
            ? adding
              ? BulkIdErrorReason.DUPLICATE
              : BulkIdErrorReason.NOT_FOUND
            : BulkIdErrorReason.NO_PERMISSION;
          return changedIds.delete(assetId) ? { id: assetId, success: true } : { id: assetId, success: false, error };
        });
        return { result, links };
      },
    );

    const changedIds = result.filter(({ success }) => success).map(({ id }) => id);
    if (changedIds.length > 0 && !this.notifyAssetPrivacy(privacyUserIds)) {
      this.resourceRepository.send({ userIds: [auth.user.id], changed: [Resource.tag({ id })] });
    }
    for (const assetId of changedIds) {
      await writeAssetTagsToExif(this.assetRepository, assetId);
      if (action === 'add') {
        await this.eventRepository.emit('AssetTag', { assetId, userId: auth.user.id });
      } else {
        await this.eventRepository.emit('AssetUntag', { assetId });
      }
    }
    return result;
  }

  @OnJob({ name: JobName.TagCleanup, queue: QueueName.BackgroundTask })
  async handleTagCleanup() {
    await this.tagRepository.deleteEmptyTags();
    return JobStatus.Success;
  }

  private findOrFail(id: string) {
    return findOrFail(() => this.tagRepository.get(id), 'Tag');
  }

  private async syncAssetTags(assetIds: string[]) {
    if (assetIds.length === 0) {
      return;
    }

    for (const assetId of assetIds) {
      await writeAssetTagsToExif(this.assetRepository, assetId);
    }

    await this.jobRepository.queueAll(assetIds.map((id) => ({ name: JobName.SidecarWrite, data: { id } })));
  }
}
