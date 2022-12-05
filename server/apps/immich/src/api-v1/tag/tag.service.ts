import { TagEntity } from '@app/database/entities/tag.entity';
import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { AuthUserDto } from '../../decorators/auth-user.decorator';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { ITagRepository, TAG_REPOSITORY } from './tag.repository';

@Injectable()
export class TagService {
  readonly logger = new Logger(TagService.name);

  constructor(@Inject(TAG_REPOSITORY) private _tagRepository: ITagRepository) {}

  async create(authUser: AuthUserDto, createTagDto: CreateTagDto) {
    try {
      return await this._tagRepository.create(authUser.id, createTagDto.type, createTagDto.name);
    } catch (e: any) {
      this.logger.error(e, e.stack);
      throw new BadRequestException(`Failed to create tag: ${e.detail}`);
    }
  }

  async findAll(authUser: AuthUserDto) {
    return await this._tagRepository.getByUserId(authUser.id);
  }

  async findOne(authUser: AuthUserDto, id: string): Promise<TagEntity> {
    const tag = await this._tagRepository.getById(id, authUser.id);

    if (!tag) {
      throw new BadRequestException('Tag not found');
    }

    return tag;
  }

  async update(authUser: AuthUserDto, id: string, updateTagDto: UpdateTagDto) {
    const tag = await this.findOne(authUser, id);

    return this._tagRepository.update(tag, updateTagDto);
  }

  async remove(authUser: AuthUserDto, id: string) {
    const tag = await this.findOne(authUser, id);

    return this._tagRepository.remove(tag);
  }
}
