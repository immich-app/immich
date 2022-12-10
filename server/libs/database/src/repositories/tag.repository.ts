import { ITagRepository, Tag, TagCreateDto, TagUpdateDto } from '@app/common';
import { TagEntity } from '@app/database/entities/tag.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

@Injectable()
export class TagRepository implements ITagRepository {
  constructor(@InjectRepository(TagEntity) private repository: Repository<TagEntity>) {}

  public async getByName(userId: string, name: string): Promise<Tag | null> {
    return this.repository.findOne({ where: { userId, name } });
  }

  public async getById(userId: string, id: string): Promise<Tag | null> {
    return this.repository.findOne({ where: { id, userId } });
  }

  public async getByIds(userId: string, ids: string[]): Promise<Tag[]> {
    return await this.repository.find({
      where: { id: In(ids), userId },
      relations: { user: true },
    });
  }

  public async getAll(userId: string): Promise<Tag[]> {
    return this.repository.find({ where: { userId } });
  }

  public async create(dto: TagCreateDto): Promise<Tag> {
    return this.repository.save(dto);
  }

  public async update(tag: TagUpdateDto): Promise<Tag> {
    return this.repository.save(tag);
  }

  public async remove(userId: string, id: string): Promise<void> {
    await this.repository.delete({ userId, id });
  }
}
