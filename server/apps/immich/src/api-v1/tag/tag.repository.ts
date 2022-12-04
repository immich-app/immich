import { AssetEntity } from '@app/database/entities/asset.entity';
import { TagEntity, TagType } from '@app/database/entities/tag.entity';
import { UserEntity } from '@app/database/entities/user.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateTagDto } from './dto/update-tag.dto';

export interface ITagRepository {
  create(userId: UserEntity, tagType: TagType, tagName: string): Promise<TagEntity>;
  getByIds(ids: string[]): Promise<TagEntity[]>;
  getById(tagId: string): Promise<TagEntity | null>;
  getByUserId(userId: string): Promise<TagEntity[]>;
  update(tag: TagEntity, updateTagDto: UpdateTagDto): Promise<TagEntity | null>;
  delete(tag: TagEntity): Promise<void>;
}

export const TAG_REPOSITORY = 'TAG_REPOSITORY';

@Injectable()
export class TagRepository implements ITagRepository {
  constructor(
    @InjectRepository(TagEntity)
    private tagRepository: Repository<TagEntity>,

    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,

    @InjectRepository(AssetEntity)
    private assetRepository: Repository<AssetEntity>,
  ) {}

  async create(user: UserEntity, tagType: TagType, tagName: string): Promise<TagEntity> {
    const tag = new TagEntity();
    tag.name = tagName;
    tag.type = tagType;
    tag.user = user;

    return this.tagRepository.save(tag);
  }

  async getById(tagId: string): Promise<TagEntity | null> {
    return await this.tagRepository.findOne({ where: { id: tagId }, relations: ['user'] });
  }

  async getByIds(ids: string[]): Promise<TagEntity[]> {
    const tags: TagEntity[] = [];

    for (const id of ids) {
      const tag = await this.getById(id);

      if (tag) {
        tags.push(tag);
      }
    }

    return tags;
  }

  async getByUserId(userId: string): Promise<TagEntity[]> {
    return await this.tagRepository.find({ where: { user: { id: userId } } });
  }

  async update(tag: TagEntity, updateTagDto: UpdateTagDto): Promise<TagEntity> {
    tag.name = updateTagDto.name ?? tag.name;
    tag.renameTagId = updateTagDto.renameTagId ?? tag.renameTagId;

    return this.tagRepository.save(tag);
  }

  async delete(tag: TagEntity): Promise<void> {
    await this.tagRepository.remove(tag);
  }
}
