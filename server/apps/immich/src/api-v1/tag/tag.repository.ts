import { AssetEntity } from '@app/database/entities/asset.entity';
import { TagEntity, TagType } from '@app/database/entities/tag.entity';
import { UserEntity } from '@app/database/entities/user.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export interface ITagRepository {
  create(userId: UserEntity, tagType: TagType, tagName: string): Promise<TagEntity>;
  getById(tagId: string): Promise<TagEntity | null>;
  getAllTagsByUserId(userId: string): Promise<TagEntity[]>;
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

  async getAllTagsByUserId(userId: string): Promise<TagEntity[]> {
    return await this.tagRepository.find({ where: { user: { id: userId } } });
  }
}
