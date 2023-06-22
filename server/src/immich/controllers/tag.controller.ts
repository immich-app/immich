import {
  AssetIdsDto,
  AssetIdsResponseDto,
  AssetResponseDto,
  CreateTagDto,
  TagResponseDto,
  TagService,
  UpdateTagDto,
} from '@app/domain';
import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthUser, AuthUserDto } from '../decorators/auth-user.decorator';
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
  createTag(@AuthUser() authUser: AuthUserDto, @Body() dto: CreateTagDto): Promise<TagResponseDto> {
    return this.service.create(authUser, dto);
  }

  @Get()
  getAllTags(@AuthUser() authUser: AuthUserDto): Promise<TagResponseDto[]> {
    return this.service.getAll(authUser);
  }

  @Get(':id')
  getTagById(@AuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto): Promise<TagResponseDto> {
    return this.service.getById(authUser, id);
  }

  @Patch(':id')
  updateTag(
    @AuthUser() authUser: AuthUserDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: UpdateTagDto,
  ): Promise<TagResponseDto> {
    return this.service.update(authUser, id, dto);
  }

  @Delete(':id')
  deleteTag(@AuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.remove(authUser, id);
  }

  @Get(':id/assets')
  getTagAssets(@AuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto): Promise<AssetResponseDto[]> {
    return this.service.getAssets(authUser, id);
  }

  @Put(':id/assets')
  tagAssets(
    @AuthUser() authUser: AuthUserDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: AssetIdsDto,
  ): Promise<AssetIdsResponseDto[]> {
    return this.service.addAssets(authUser, id, dto);
  }

  @Delete(':id/assets')
  untagAssets(
    @AuthUser() authUser: AuthUserDto,
    @Body() dto: AssetIdsDto,
    @Param() { id }: UUIDParamDto,
  ): Promise<AssetIdsResponseDto[]> {
    return this.service.removeAssets(authUser, id, dto);
  }
}
