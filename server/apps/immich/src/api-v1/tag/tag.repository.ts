import { TagEntity, TagType } from '@app/infra';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UpdateTagDto } from './dto/update-tag.dto';

export interface ITagRepository {
  create(userId: string, tagType: TagType, tagName: string): Promise<TagEntity>;
  getByIds(userId: string, tagIds: string[]): Promise<TagEntity[]>;
  getById(tagId: string, userId: string): Promise<TagEntity | null>;
  getByUserId(userId: string): Promise<TagEntity[]>;
  update(tag: TagEntity, updateTagDto: UpdateTagDto): Promise<TagEntity | null>;
  remove(tag: TagEntity): Promise<TagEntity>;
}

export const ITagRepository = 'ITagRepository';

@Injectable()
export class TagRepository implements ITagRepository {
  constructor(
    @InjectRepository(TagEntity)
    private tagRepository: Repository<TagEntity>,
  ) {}

  async create(userId: string, tagType: TagType, tagName: string): Promise<TagEntity> {
    const tag = new TagEntity();
    tag.name = tagName;
    tag.type = tagType;
    tag.userId = userId;

    return this.tagRepository.save(tag);
  }

  async getById(tagId: string, userId: string): Promise<TagEntity | null> {
    return await this.tagRepository.findOne({ where: { id: tagId, userId }, relations: ['user'] });
  }

  async getByIds(userId: string, tagIds: string[]): Promise<TagEntity[]> {
    return await this.tagRepository.find({
      where: { id: In(tagIds), userId },
      relations: {
        user: true,
      },
    });
  }

  async getByUserId(userId: string): Promise<TagEntity[]> {
    return await this.tagRepository.find({ where: { userId } });
  }

  async update(tag: TagEntity, updateTagDto: UpdateTagDto): Promise<TagEntity> {
    tag.name = updateTagDto.name ?? tag.name;
    tag.renameTagId = updateTagDto.renameTagId ?? tag.renameTagId;

    return this.tagRepository.save(tag);
  }

  async remove(tag: TagEntity): Promise<TagEntity> {
    return await this.tagRepository.remove(tag);
  }
}
