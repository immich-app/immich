import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AssetIdsResponseDto } from 'src/dtos/asset-ids.response.dto';
import { AssetResponseDto } from 'src/dtos/asset-response.dto';
import { AssetIdsDto } from 'src/dtos/asset.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { CreateTagDto, TagResponseDto, UpdateTagDto } from 'src/dtos/tag.dto';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { TagService } from 'src/services/tag.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags('Tag')
@Controller('tag')
export class TagController {
  constructor(private service: TagService) {}

  @Post()
  @Authenticated()
  createTag(@Auth() auth: AuthDto, @Body() dto: CreateTagDto): Promise<TagResponseDto> {
    return this.service.create(auth, dto);
  }

  @Get()
  @Authenticated()
  getAllTags(@Auth() auth: AuthDto): Promise<TagResponseDto[]> {
    return this.service.getAll(auth);
  }

  @Get(':id')
  @Authenticated()
  getTagById(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<TagResponseDto> {
    return this.service.getById(auth, id);
  }

  @Patch(':id')
  @Authenticated()
  updateTag(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto, @Body() dto: UpdateTagDto): Promise<TagResponseDto> {
    return this.service.update(auth, id, dto);
  }

  @Delete(':id')
  @Authenticated()
  deleteTag(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.remove(auth, id);
  }

  @Get(':id/assets')
  @Authenticated()
  getTagAssets(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<AssetResponseDto[]> {
    return this.service.getAssets(auth, id);
  }

  @Put(':id/assets')
  @Authenticated()
  tagAssets(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: AssetIdsDto,
  ): Promise<AssetIdsResponseDto[]> {
    return this.service.addAssets(auth, id, dto);
  }

  @Delete(':id/assets')
  @Authenticated()
  untagAssets(
    @Auth() auth: AuthDto,
    @Body() dto: AssetIdsDto,
    @Param() { id }: UUIDParamDto,
  ): Promise<AssetIdsResponseDto[]> {
    return this.service.removeAssets(auth, id, dto);
  }
}
