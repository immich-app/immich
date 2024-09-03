import { BadRequestException, Inject, Injectable } from '@nestjs/common';
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
import { IAccessRepository } from 'src/interfaces/access.interface';
import { IEventRepository } from 'src/interfaces/event.interface';
import { AssetTagItem, ITagRepository } from 'src/interfaces/tag.interface';
import { checkAccess, requireAccess } from 'src/utils/access';
import { addAssets, removeAssets } from 'src/utils/asset.util';
import { upsertTags } from 'src/utils/tag';

@Injectable()
export class TagService {
  constructor(
    @Inject(IAccessRepository) private access: IAccessRepository,
    @Inject(IEventRepository) private eventRepository: IEventRepository,
    @Inject(ITagRepository) private repository: ITagRepository,
  ) {}

  async getAll(auth: AuthDto) {
    const tags = await this.repository.getAll(auth.user.id);
    return tags.map((tag) => mapTag(tag));
  }

  async get(auth: AuthDto, id: string): Promise<TagResponseDto> {
    await requireAccess(this.access, { auth, permission: Permission.TAG_READ, ids: [id] });
    const tag = await this.findOrFail(id);
    return mapTag(tag);
  }

  async create(auth: AuthDto, dto: TagCreateDto) {
    let parent: TagEntity | undefined;
    if (dto.parentId) {
      await requireAccess(this.access, { auth, permission: Permission.TAG_READ, ids: [dto.parentId] });
      parent = (await this.repository.get(dto.parentId)) || undefined;
      if (!parent) {
        throw new BadRequestException('Tag not found');
      }
    }

    const userId = auth.user.id;
    const value = parent ? `${parent.value}/${dto.name}` : dto.name;
    const duplicate = await this.repository.getByValue(userId, value);
    if (duplicate) {
      throw new BadRequestException(`A tag with that name already exists`);
    }

    const tag = await this.repository.create({ userId, value, parent });

    return mapTag(tag);
  }

  async update(auth: AuthDto, id: string, dto: TagUpdateDto): Promise<TagResponseDto> {
    await requireAccess(this.access, { auth, permission: Permission.TAG_UPDATE, ids: [id] });

    const { color } = dto;
    const tag = await this.repository.update({ id, color });
    return mapTag(tag);
  }

  async upsert(auth: AuthDto, dto: TagUpsertDto) {
    const tags = await upsertTags(this.repository, { userId: auth.user.id, tags: dto.tags });
    return tags.map((tag) => mapTag(tag));
  }

  async remove(auth: AuthDto, id: string): Promise<void> {
    await requireAccess(this.access, { auth, permission: Permission.TAG_DELETE, ids: [id] });

    // TODO sync tag changes for affected assets

    await this.repository.delete(id);
  }

  async bulkTagAssets(auth: AuthDto, dto: TagBulkAssetsDto): Promise<TagBulkAssetsResponseDto> {
    const [tagIds, assetIds] = await Promise.all([
      checkAccess(this.access, { auth, permission: Permission.TAG_ASSET, ids: dto.tagIds }),
      checkAccess(this.access, { auth, permission: Permission.ASSET_UPDATE, ids: dto.assetIds }),
    ]);

    const items: AssetTagItem[] = [];
    for (const tagId of tagIds) {
      for (const assetId of assetIds) {
        items.push({ tagId, assetId });
      }
    }

    const results = await this.repository.upsertAssetIds(items);
    for (const assetId of new Set(results.map((item) => item.assetId))) {
      await this.eventRepository.emit('asset.tag', { assetId });
    }

    return { count: results.length };
  }

  async addAssets(auth: AuthDto, id: string, dto: BulkIdsDto): Promise<BulkIdResponseDto[]> {
    await requireAccess(this.access, { auth, permission: Permission.TAG_ASSET, ids: [id] });

    const results = await addAssets(
      auth,
      { access: this.access, bulk: this.repository },
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
    await requireAccess(this.access, { auth, permission: Permission.TAG_ASSET, ids: [id] });

    const results = await removeAssets(
      auth,
      { access: this.access, bulk: this.repository },
      { parentId: id, assetIds: dto.ids, canAlwaysRemove: Permission.TAG_DELETE },
    );

    for (const { id: assetId, success } of results) {
      if (success) {
        await this.eventRepository.emit('asset.untag', { assetId });
      }
    }

    return results;
  }

  private async findOrFail(id: string) {
    const tag = await this.repository.get(id);
    if (!tag) {
      throw new BadRequestException('Tag not found');
    }
    return tag;
  }
}
