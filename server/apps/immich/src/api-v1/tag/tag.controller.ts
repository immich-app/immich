import { TagService } from '@app/common';
import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, ValidationPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthUserDto, GetAuthUser } from '../../decorators/auth-user.decorator';
import { Authenticated } from '../../decorators/authenticated.decorator';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { mapTag, TagResponseDto } from './response-dto/tag-response.dto';

@Authenticated()
@ApiTags('Tag')
@Controller('tag')
export class TagController {
  constructor(private readonly service: TagService) {}

  @Post()
  public async create(
    @GetAuthUser() authUser: AuthUserDto,
    @Body(ValidationPipe) dto: CreateTagDto,
  ): Promise<TagResponseDto> {
    return this.service.create({ ...dto, userId: authUser.id });
  }

  @Get()
  public async getAll(@GetAuthUser() authUser: AuthUserDto): Promise<TagResponseDto[]> {
    return this.service.findAll(authUser.id);
  }

  @Get(':id')
  public async getById(@GetAuthUser() authUser: AuthUserDto, @Param('id') id: string): Promise<TagResponseDto> {
    const tag = await this.service.findOne(authUser.id, id);
    if (!tag) {
      throw new BadRequestException('Tag not found');
    }
    return mapTag(tag);
  }

  @Patch(':id')
  public async update(
    @GetAuthUser() authUser: AuthUserDto,
    @Param('id') id: string,
    @Body(ValidationPipe) dto: UpdateTagDto,
  ): Promise<TagResponseDto> {
    return this.service.update({ ...dto, userId: authUser.id, id });
  }

  @Delete(':id')
  public async remove(@GetAuthUser() authUser: AuthUserDto, @Param('id') id: string): Promise<void> {
    const tag = await this.service.findOne(authUser.id, id);
    if (!tag) {
      throw new BadRequestException('Tag not found');
    }
    return this.service.remove(authUser.id, tag.id);
  }
}
