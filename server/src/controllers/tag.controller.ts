import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TagService } from 'src/domain/tag/tag.service';
import { AssetIdsResponseDto } from 'src/dtos/asset-ids.response.dto';
import { AssetResponseDto } from 'src/dtos/asset-response.dto';
import { AssetIdsDto } from 'src/dtos/asset.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { CreateTagDto, TagResponseDto, UpdateTagDto } from 'src/dtos/tag.dto';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { UUIDParamDto } from 'src/validation';

@ApiTags('Tag')
@Controller('tag')
@Authenticated()
export class TagController {
  constructor(private service: TagService) {}

  @Post()
  createTag(@Auth() auth: AuthDto, @Body() dto: CreateTagDto): Promise<TagResponseDto> {
    return this.service.create(auth, dto);
  }

  @Get()
  getAllTags(@Auth() auth: AuthDto): Promise<TagResponseDto[]> {
    return this.service.getAll(auth);
  }

  @Get(':id')
  getTagById(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<TagResponseDto> {
    return this.service.getById(auth, id);
  }

  @Patch(':id')
  updateTag(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto, @Body() dto: UpdateTagDto): Promise<TagResponseDto> {
    return this.service.update(auth, id, dto);
  }

  @Delete(':id')
  deleteTag(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.remove(auth, id);
  }

  @Get(':id/assets')
  getTagAssets(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<AssetResponseDto[]> {
    return this.service.getAssets(auth, id);
  }

  @Put(':id/assets')
  tagAssets(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: AssetIdsDto,
  ): Promise<AssetIdsResponseDto[]> {
    return this.service.addAssets(auth, id, dto);
  }

  @Delete(':id/assets')
  untagAssets(
    @Auth() auth: AuthDto,
    @Body() dto: AssetIdsDto,
    @Param() { id }: UUIDParamDto,
  ): Promise<AssetIdsResponseDto[]> {
    return this.service.removeAssets(auth, id, dto);
  }
}
