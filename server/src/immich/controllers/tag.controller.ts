import {
  AssetIdsDto,
  AssetIdsResponseDto,
  AssetResponseDto,
  AuthDto,
  CreateTagDto,
  TagResponseDto,
  TagService,
  UpdateTagDto,
} from '@app/domain';
import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthUser, Authenticated } from '../app.guard';
import { UseValidation } from '../app.utils';
import { UUIDParamDto } from './dto/uuid-param.dto';

@ApiTags('Tag')
@Controller('tag')
@Authenticated()
@UseValidation()
export class TagController {
  constructor(private service: TagService) {}

  @Post()
  createTag(@AuthUser() auth: AuthDto, @Body() dto: CreateTagDto): Promise<TagResponseDto> {
    return this.service.create(auth, dto);
  }

  @Get()
  getAllTags(@AuthUser() auth: AuthDto): Promise<TagResponseDto[]> {
    return this.service.getAll(auth);
  }

  @Get(':id')
  getTagById(@AuthUser() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<TagResponseDto> {
    return this.service.getById(auth, id);
  }

  @Patch(':id')
  updateTag(
    @AuthUser() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: UpdateTagDto,
  ): Promise<TagResponseDto> {
    return this.service.update(auth, id, dto);
  }

  @Delete(':id')
  deleteTag(@AuthUser() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.remove(auth, id);
  }

  @Get(':id/assets')
  getTagAssets(@AuthUser() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<AssetResponseDto[]> {
    return this.service.getAssets(auth, id);
  }

  @Put(':id/assets')
  tagAssets(
    @AuthUser() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: AssetIdsDto,
  ): Promise<AssetIdsResponseDto[]> {
    return this.service.addAssets(auth, id, dto);
  }

  @Delete(':id/assets')
  untagAssets(
    @AuthUser() auth: AuthDto,
    @Body() dto: AssetIdsDto,
    @Param() { id }: UUIDParamDto,
  ): Promise<AssetIdsResponseDto[]> {
    return this.service.removeAssets(auth, id, dto);
  }
}
