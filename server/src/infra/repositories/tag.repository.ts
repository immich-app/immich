import { ITagRepository } from '@app/domain';
import { AssetEntity, TagEntity } from '@app/infra/entities';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class TagRepository implements ITagRepository {
  constructor(
    @InjectRepository(AssetEntity) private assetRepository: Repository<AssetEntity>,
    @InjectRepository(TagEntity) private repository: Repository<TagEntity>,
  ) {}

  getById(userId: string, id: string): Promise<TagEntity | null> {
    return this.repository.findOne({
      where: {
        id,
        userId,
      },
      relations: {
        user: true,
      },
    });
  }

  getAll(userId: string): Promise<TagEntity[]> {
    return this.repository.find({ where: { userId } });
  }

  create(tag: Partial<TagEntity>): Promise<TagEntity> {
    return this.save(tag);
  }

  update(tag: Partial<TagEntity>): Promise<TagEntity> {
    return this.save(tag);
  }

  async remove(tag: TagEntity): Promise<void> {
    await this.repository.remove(tag);
  }

  async getAssets(userId: string, tagId: string): Promise<AssetEntity[]> {
    return this.assetRepository.find({
      where: {
        tags: {
          userId,
          id: tagId,
        },
      },
      relations: {
        exifInfo: true,
        tags: true,
        faces: {
          person: true,
        },
      },
      order: {
        createdAt: 'ASC',
      },
    });
  }

  async addAssets(userId: string, id: string, assetIds: string[]): Promise<void> {
    for (const assetId of assetIds) {
      const asset = await this.assetRepository.findOneOrFail({
        where: {
          ownerId: userId,
          id: assetId,
        },
        relations: {
          tags: true,
        },
      });
      asset.tags.push({ id } as TagEntity);
      await this.assetRepository.save(asset);
    }
  }

  async removeAssets(userId: string, id: string, assetIds: string[]): Promise<void> {
    for (const assetId of assetIds) {
      const asset = await this.assetRepository.findOneOrFail({
        where: {
          ownerId: userId,
          id: assetId,
        },
        relations: {
          tags: true,
        },
      });
      asset.tags = asset.tags.filter((tag) => tag.id !== id);
      await this.assetRepository.save(asset);
    }
  }

  hasAsset(userId: string, tagId: string, assetId: string): Promise<boolean> {
    return this.repository.exist({
      where: {
        id: tagId,
        userId,
        assets: {
          id: assetId,
        },
      },
      relations: {
        assets: true,
      },
    });
  }

  hasName(userId: string, name: string): Promise<boolean> {
    return this.repository.exist({
      where: {
        name,
        userId,
      },
    });
  }

  private async save(tag: Partial<TagEntity>): Promise<TagEntity> {
    const { id } = await this.repository.save(tag);
    return this.repository.findOneOrFail({ where: { id }, relations: { user: true } });
  }
}
