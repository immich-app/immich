import { BadRequestException, Inject, Injectable } from '@nestjs/common';
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
    const tag = await this.repository.getById(authUser.id, id);
    if (!tag) {
      throw new BadRequestException('Tag not found');
    }

    return mapTag(tag);
  }

  create(authUser: AuthUserDto, dto: CreateTagDto) {
    // TODO: uniqueness check?
    return this.repository
      .create({
        userId: authUser.id,
        name: dto.name,
        type: dto.type,
      })
      .then(mapTag);
  }

  async update(authUser: AuthUserDto, id: string, dto: UpdateTagDto): Promise<TagResponseDto> {
    const tag = await this.repository.getById(authUser.id, id);
    if (!tag) {
      throw new BadRequestException('Tag not found');
    }
    return this.repository.update({ id, name: dto.name }).then(mapTag);
  }

  async remove(authUser: AuthUserDto, id: string): Promise<void> {
    const tag = await this.repository.getById(authUser.id, id);
    if (!tag) {
      throw new BadRequestException('Tag not found');
    }
    await this.repository.remove(tag);
  }
}
