import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { AssetIdErrorReason, AssetIdsDto, AssetIdsResponseDto, AssetResponseDto, mapAsset } from '../asset';
import { AuthDto } from '../auth';
import { ITagRepository } from '../repositories';
import { TagResponseDto, mapTag } from './tag-response.dto';
import { CreateTagDto, UpdateTagDto } from './tag.dto';

@Injectable()
export class TagService {
  constructor(@Inject(ITagRepository) private repository: ITagRepository) {}

  getAll(auth: AuthDto) {
    return this.repository.getAll(auth.user.id).then((tags) => tags.map((tag) => mapTag(tag)));
  }

  async getById(auth: AuthDto, id: string): Promise<TagResponseDto> {
    const tag = await this.findOrFail(auth, id);
    return mapTag(tag);
  }

  async create(auth: AuthDto, dto: CreateTagDto) {
    const duplicate = await this.repository.hasName(auth.user.id, dto.name);
    if (duplicate) {
      throw new BadRequestException(`A tag with that name already exists`);
    }

    const tag = await this.repository.create({
      userId: auth.user.id,
      name: dto.name,
      type: dto.type,
    });

    return mapTag(tag);
  }

  async update(auth: AuthDto, id: string, dto: UpdateTagDto): Promise<TagResponseDto> {
    await this.findOrFail(auth, id);
    const tag = await this.repository.update({ id, name: dto.name });
    return mapTag(tag);
  }

  async remove(auth: AuthDto, id: string): Promise<void> {
    const tag = await this.findOrFail(auth, id);
    await this.repository.remove(tag);
  }

  async getAssets(auth: AuthDto, id: string): Promise<AssetResponseDto[]> {
    await this.findOrFail(auth, id);
    const assets = await this.repository.getAssets(auth.user.id, id);
    return assets.map((asset) => mapAsset(asset));
  }

  async addAssets(auth: AuthDto, id: string, dto: AssetIdsDto): Promise<AssetIdsResponseDto[]> {
    await this.findOrFail(auth, id);

    const results: AssetIdsResponseDto[] = [];
    for (const assetId of dto.assetIds) {
      const hasAsset = await this.repository.hasAsset(auth.user.id, id, assetId);
      if (hasAsset) {
        results.push({ assetId, success: false, error: AssetIdErrorReason.DUPLICATE });
      } else {
        results.push({ assetId, success: true });
      }
    }

    await this.repository.addAssets(
      auth.user.id,
      id,
      results.filter((result) => result.success).map((result) => result.assetId),
    );

    return results;
  }

  async removeAssets(auth: AuthDto, id: string, dto: AssetIdsDto): Promise<AssetIdsResponseDto[]> {
    await this.findOrFail(auth, id);

    const results: AssetIdsResponseDto[] = [];
    for (const assetId of dto.assetIds) {
      const hasAsset = await this.repository.hasAsset(auth.user.id, id, assetId);
      if (hasAsset) {
        results.push({ assetId, success: true });
      } else {
        results.push({ assetId, success: false, error: AssetIdErrorReason.NOT_FOUND });
      }
    }

    await this.repository.removeAssets(
      auth.user.id,
      id,
      results.filter((result) => result.success).map((result) => result.assetId),
    );

    return results;
  }

  private async findOrFail(auth: AuthDto, id: string) {
    const tag = await this.repository.getById(auth.user.id, id);
    if (!tag) {
      throw new BadRequestException('Tag not found');
    }
    return tag;
  }
}
