import { TagEntity } from '@app/database/entities/tag.entity';
import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { AuthUserDto } from '../../decorators/auth-user.decorator';
import { IUserRepository, USER_REPOSITORY } from '../user/user-repository';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { ITagRepository, TAG_REPOSITORY } from './tag.repository';

@Injectable()
export class TagService {
  constructor(
    @Inject(TAG_REPOSITORY) private _tagRepository: ITagRepository,
    @Inject(USER_REPOSITORY) private _userRepository: IUserRepository,
  ) {}

  async create(authUser: AuthUserDto, createTagDto: CreateTagDto) {
    const user = await this._userRepository.get(authUser.id);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const existingTags = await this._tagRepository.getAllTagsByUserId(authUser.id);

    const existingTag = existingTags.find((tag) => tag.name === createTagDto.name && tag.type === createTagDto.type);

    if (existingTag) {
      throw new BadRequestException('Tag already exists');
    }

    return this._tagRepository.create(user, createTagDto.type, createTagDto.name);
  }

  findAll(authUser: AuthUserDto) {
    return this._tagRepository.getAllTagsByUserId(authUser.id);
  }

  async findOne(authUser: AuthUserDto, id: string): Promise<TagEntity | null> {
    const tag = await this._tagRepository.getById(id);

    if (!tag) {
      throw new BadRequestException('Tag not found');
    }

    this.checkTagOwnerShip(authUser, tag);

    return tag;
  }

  async update(authUser: AuthUserDto, id: string, updateTagDto: UpdateTagDto) {
    const tag = await this._tagRepository.getById(id);

    if (!tag) {
      throw new BadRequestException('Tag not found');
    }

    this.checkTagOwnerShip(authUser, tag);

    return this._tagRepository.update(tag, updateTagDto);
  }

  async delete(authUser: AuthUserDto, id: string) {
    const tag = await this._tagRepository.getById(id);

    if (!tag) {
      throw new BadRequestException('Tag not found');
    }

    this.checkTagOwnerShip(authUser, tag);

    return this._tagRepository.delete(tag);
  }

  private checkTagOwnerShip(authUser: AuthUserDto, tag: TagEntity) {
    if (tag.user.id !== authUser.id) {
      throw new ForbiddenException('User do not have access to this tag');
    }
  }
}
