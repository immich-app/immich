import { Controller, Get, Post, Body, Patch, Param, Delete, ValidationPipe } from '@nestjs/common';
import { TagService } from './tag.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { Authenticated } from '../../decorators/authenticated.decorator';
import { ApiTags } from '@nestjs/swagger';
import { AuthUserDto, GetAuthUser } from '../../decorators/auth-user.decorator';
import { TagEntity } from '@app/database/entities/tag.entity';

@Authenticated()
@ApiTags('Tag')
@Controller('tag')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Post()
  create(@GetAuthUser() authUser: AuthUserDto, @Body(ValidationPipe) createTagDto: CreateTagDto): Promise<TagEntity> {
    return this.tagService.create(authUser, createTagDto);
  }

  @Get()
  findAll(@GetAuthUser() authUser: AuthUserDto) {
    return this.tagService.findAll(authUser);
  }

  @Get(':id')
  findOne(@GetAuthUser() authUser: AuthUserDto, @Param('id') id: string) {
    return this.tagService.findOne(authUser, id);
  }

  @Patch(':id')
  update(
    @GetAuthUser() authUser: AuthUserDto,
    @Param('id') id: string,
    @Body(ValidationPipe) updateTagDto: UpdateTagDto,
  ) {
    return this.tagService.update(authUser, id, updateTagDto);
  }

  @Delete(':id')
  delete(@GetAuthUser() authUser: AuthUserDto, @Param('id') id: string) {
    return this.tagService.remove(authUser, id);
  }
}
