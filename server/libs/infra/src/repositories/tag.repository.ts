import { ITagRepository } from '@app/domain';
import { TagEntity } from '@app/infra/entities';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

@Injectable()
export class TagRepository implements ITagRepository {
  constructor(@InjectRepository(TagEntity) private repository: Repository<TagEntity>) {}

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

  private async save(tag: Partial<TagEntity>): Promise<TagEntity> {
    const { id } = await this.repository.save(tag);
    return this.repository.findOneOrFail({ where: { id }, relations: { user: true } });
  }
}
