import { TagEntity } from '@app/database/entities/tag.entity';
import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { AuthUserDto } from '../../decorators/auth-user.decorator';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { ITagRepository, TAG_REPOSITORY } from './tag.repository';
import { mapTag, TagResponseDto } from "./response-dto/tag-response.dto";

@Injectable()
export class TagService {
  readonly logger = new Logger(TagService.name);

  constructor(@Inject(TAG_REPOSITORY) private _tagRepository: ITagRepository) {}

  async create(authUser: AuthUserDto, createTagDto: CreateTagDto) {
    try {
      const newTag = await this._tagRepository.create(authUser.id, createTagDto.type, createTagDto.name);
      return mapTag(newTag);
    } catch (e: any) {
      this.logger.error(e, e.stack);
      throw new BadRequestException(`Failed to create tag: ${e.detail}`);
    }
  }

  async findAll(authUser: AuthUserDto) {
    const tags = await this._tagRepository.getByUserId(authUser.id);
    return tags.map(mapTag);
  }

  async findOne(authUser: AuthUserDto, id: string): Promise<TagEntity> {
    const tag = await this._tagRepository.getById(id, authUser.id);

    if (!tag) {
      throw new BadRequestException('Tag not found');
    }

    return tag;
  }

  async update(authUser: AuthUserDto, id: string, updateTagDto: UpdateTagDto): Promise<TagResponseDto>  {
    const tag = await this.findOne(authUser, id);

    await this._tagRepository.update(tag, updateTagDto);

    return mapTag(tag);
  }

  async remove(authUser: AuthUserDto, id: string): Promise<void> {
    const tag = await this.findOne(authUser, id);
    await this._tagRepository.remove(tag);
  }
}
