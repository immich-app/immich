import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { AssetIdErrorReason, AssetIdsDto, AssetIdsResponseDto, AssetResponseDto, mapAsset } from '../asset';
import { AuthUserDto } from '../auth';
import { mapTag, TagResponseDto } from './tag-response.dto';
import { CreateTagDto, UpdateTagDto } from './tag.dto';
import { ITagRepository } from './tag.repository';

@Injectable()
export class TagService {
  constructor(@Inject(ITagRepository) private repository: ITagRepository) {}

  getAll(authUser: AuthUserDto) {
    return this.repository.getAll(authUser.id).then((tags) => tags.map(mapTag));
  }

  async getById(authUser: AuthUserDto, id: string): Promise<TagResponseDto> {
    const tag = await this.findOrFail(authUser, id);
    return mapTag(tag);
  }

  async create(authUser: AuthUserDto, dto: CreateTagDto) {
    const duplicate = await this.repository.hasName(authUser.id, dto.name);
    if (duplicate) {
      throw new BadRequestException(`A tag with that name already exists`);
    }

    const tag = await this.repository.create({
      userId: authUser.id,
      name: dto.name,
      type: dto.type,
    });

    return mapTag(tag);
  }

  async update(authUser: AuthUserDto, id: string, dto: UpdateTagDto): Promise<TagResponseDto> {
    await this.findOrFail(authUser, id);
    const tag = await this.repository.update({ id, name: dto.name });
    return mapTag(tag);
  }

  async remove(authUser: AuthUserDto, id: string): Promise<void> {
    const tag = await this.findOrFail(authUser, id);
    await this.repository.remove(tag);
  }

  async getAssets(authUser: AuthUserDto, id: string): Promise<AssetResponseDto[]> {
    await this.findOrFail(authUser, id);
    const assets = await this.repository.getAssets(authUser.id, id);
    return assets.map(mapAsset);
  }

  async addAssets(authUser: AuthUserDto, id: string, dto: AssetIdsDto): Promise<AssetIdsResponseDto[]> {
    await this.findOrFail(authUser, id);

    const results: AssetIdsResponseDto[] = [];
    for (const assetId of dto.assetIds) {
      const hasAsset = await this.repository.hasAsset(authUser.id, id, assetId);
      if (hasAsset) {
        results.push({ assetId, success: false, error: AssetIdErrorReason.DUPLICATE });
      } else {
        results.push({ assetId, success: true });
      }
    }

    await this.repository.addAssets(
      authUser.id,
      id,
      results.filter((result) => result.success).map((result) => result.assetId),
    );

    return results;
  }

  async removeAssets(authUser: AuthUserDto, id: string, dto: AssetIdsDto): Promise<AssetIdsResponseDto[]> {
    await this.findOrFail(authUser, id);

    const results: AssetIdsResponseDto[] = [];
    for (const assetId of dto.assetIds) {
      const hasAsset = await this.repository.hasAsset(authUser.id, id, assetId);
      if (!hasAsset) {
        results.push({ assetId, success: false, error: AssetIdErrorReason.NOT_FOUND });
      } else {
        results.push({ assetId, success: true });
      }
    }

    await this.repository.removeAssets(
      authUser.id,
      id,
      results.filter((result) => result.success).map((result) => result.assetId),
    );

    return results;
  }

  private async findOrFail(authUser: AuthUserDto, id: string) {
    const tag = await this.repository.getById(authUser.id, id);
    if (!tag) {
      throw new BadRequestException('Tag not found');
    }
    return tag;
  }
}
