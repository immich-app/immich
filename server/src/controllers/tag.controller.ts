import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BulkIdResponseDto, BulkIdsDto } from 'src/dtos/asset-ids.response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  TagBulkAssetsDto,
  TagBulkAssetsResponseDto,
  TagCreateDto,
  TagResponseDto,
  TagUpdateDto,
  TagUpsertDto,
} from 'src/dtos/tag.dto';
import { Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { TagService } from 'src/services/tag.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags('Tags')
@Controller('tags')
export class TagController {
  constructor(private service: TagService) {}

  @Post()
  @Authenticated({ permission: Permission.TAG_CREATE })
  createTag(@Auth() auth: AuthDto, @Body() dto: TagCreateDto): Promise<TagResponseDto> {
    return this.service.create(auth, dto);
  }

  @Get()
  @Authenticated({ permission: Permission.TAG_READ })
  getAllTags(@Auth() auth: AuthDto): Promise<TagResponseDto[]> {
    return this.service.getAll(auth);
  }

  @Put()
  @Authenticated({ permission: Permission.TAG_CREATE })
  upsertTags(@Auth() auth: AuthDto, @Body() dto: TagUpsertDto): Promise<TagResponseDto[]> {
    return this.service.upsert(auth, dto);
  }

  @Put('assets')
  @Authenticated({ permission: Permission.TAG_ASSET })
  bulkTagAssets(@Auth() auth: AuthDto, @Body() dto: TagBulkAssetsDto): Promise<TagBulkAssetsResponseDto> {
    return this.service.bulkTagAssets(auth, dto);
  }

  @Get(':id')
  @Authenticated({ permission: Permission.TAG_READ })
  getTagById(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<TagResponseDto> {
    return this.service.get(auth, id);
  }

  @Put(':id')
  @Authenticated({ permission: Permission.TAG_UPDATE })
  updateTag(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto, @Body() dto: TagUpdateDto): Promise<TagResponseDto> {
    return this.service.update(auth, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authenticated({ permission: Permission.TAG_DELETE })
  deleteTag(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.remove(auth, id);
  }

  @Put(':id/assets')
  @Authenticated({ permission: Permission.TAG_ASSET })
  tagAssets(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: BulkIdsDto,
  ): Promise<BulkIdResponseDto[]> {
    return this.service.addAssets(auth, id, dto);
  }

  @Delete(':id/assets')
  @Authenticated({ permission: Permission.TAG_ASSET })
  untagAssets(
    @Auth() auth: AuthDto,
    @Body() dto: BulkIdsDto,
    @Param() { id }: UUIDParamDto,
  ): Promise<BulkIdResponseDto[]> {
    return this.service.removeAssets(auth, id, dto);
  }
}
