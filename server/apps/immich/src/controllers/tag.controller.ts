import { CreateTagDto, TagResponseDto, TagService, UpdateTagDto } from '@app/domain';
import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthUserDto, GetAuthUser } from '../decorators/auth-user.decorator';
import { Authenticated } from '../decorators/authenticated.decorator';
import { UseValidation } from '../decorators/use-validation.decorator';
import { UUIDParamDto } from './dto/uuid-param.dto';

@ApiTags('Tag')
@Controller('tag')
@Authenticated()
@UseValidation()
export class TagController {
  constructor(private service: TagService) {}

  @Post()
  createTag(@GetAuthUser() authUser: AuthUserDto, @Body() dto: CreateTagDto): Promise<TagResponseDto> {
    return this.service.create(authUser, dto);
  }

  @Get()
  getAllTags(@GetAuthUser() authUser: AuthUserDto): Promise<TagResponseDto[]> {
    return this.service.getAll(authUser);
  }

  @Get(':id')
  getTagById(@GetAuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto): Promise<TagResponseDto> {
    return this.service.getById(authUser, id);
  }

  @Patch(':id')
  updateTag(
    @GetAuthUser() authUser: AuthUserDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: UpdateTagDto,
  ): Promise<TagResponseDto> {
    return this.service.update(authUser, id, dto);
  }

  @Delete(':id')
  deleteTag(@GetAuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.remove(authUser, id);
  }
}
