import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { Tag } from '../models';

export type TagCreateDto = Pick<Tag, 'userId' | 'name' | 'type'> & Partial<Tag>;
export type TagUpdateDto = Pick<Tag, 'userId' | 'id'> & Partial<Tag>;

export const ITagRepository = 'ITagRepository';

export interface ITagRepository {
  findById(userId: string, id: string): Promise<Tag | null>;
  findByIds(userId: string, ids: string[]): Promise<Tag[]>;
  findByName(userId: string, name: string): Promise<Tag | null>;
  findAll(userId: string): Promise<Tag[]>;
  create(dto: TagCreateDto): Promise<Tag>;
  update(dto: TagUpdateDto): Promise<Tag>;
  remove(userId: string, id: string): Promise<void>;
}

@Injectable()
export class TagService {
  readonly logger = new Logger(TagService.name);

  constructor(@Inject(ITagRepository) private repository: ITagRepository) {}

  public async create(dto: TagCreateDto) {
    const { userId, name } = dto;
    const exists = await this.repository.findByName(userId, name);
    if (exists) {
      throw new BadRequestException('Tag already exists');
    }

    return this.repository.create(dto);
  }

  public async update(dto: TagUpdateDto) {
    const { userId, id } = dto;
    const exists = await this.repository.findById(userId, id);
    if (!exists) {
      throw new BadRequestException('Tag not found');
    }

    exists.name = dto.name ?? exists.name;
    exists.renameTagId = dto.renameTagId ?? exists.renameTagId;

    return this.repository.update(exists);
  }

  public async findOne(userId: string, id: string): Promise<Tag | null> {
    return this.repository.findById(userId, id);
  }

  public async findAll(userId: string): Promise<Tag[]> {
    return this.repository.findAll(userId);
  }

  public async remove(userId: string, id: string): Promise<void> {
    const tag = await this.findOne(userId, id);
    if (!tag) {
      throw new BadRequestException('Tag not found');
    }
    await this.repository.remove(userId, tag.id);
  }
}
