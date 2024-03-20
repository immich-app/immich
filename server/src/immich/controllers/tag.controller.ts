import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AssetIdsDto } from 'src/domain/asset/dto/asset-ids.dto';
import { AssetIdsResponseDto } from 'src/domain/asset/response-dto/asset-ids-response.dto';
import { AssetResponseDto } from 'src/domain/asset/response-dto/asset-response.dto';
import { AuthDto } from 'src/domain/auth/auth.dto';
import { TagResponseDto } from 'src/domain/tag/tag-response.dto';
import { CreateTagDto, UpdateTagDto } from 'src/domain/tag/tag.dto';
import { TagService } from 'src/domain/tag/tag.service';
import { Auth, Authenticated } from 'src/immich/app.guard';
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
