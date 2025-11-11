import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
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
import { ApiTag, Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { TagService } from 'src/services/tag.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags(ApiTag.Tags)
@Controller('tags')
export class TagController {
  constructor(private service: TagService) {}

  @Post()
  @Authenticated({ permission: Permission.TagCreate })
  @ApiOperation({
    summary: 'Create a tag',
    description: 'Create a new tag by providing a name and optional color.',
  })
  createTag(@Auth() auth: AuthDto, @Body() dto: TagCreateDto): Promise<TagResponseDto> {
    return this.service.create(auth, dto);
  }

  @Get()
  @Authenticated({ permission: Permission.TagRead })
  @ApiOperation({
    summary: 'Retrieve tags',
    description: 'Retrieve a list of all tags.',
  })
  getAllTags(@Auth() auth: AuthDto): Promise<TagResponseDto[]> {
    return this.service.getAll(auth);
  }

  @Put()
  @Authenticated({ permission: Permission.TagCreate })
  @ApiOperation({
    summary: 'Upsert tags',
    description: 'Create or update multiple tags in a single request.',
  })
  upsertTags(@Auth() auth: AuthDto, @Body() dto: TagUpsertDto): Promise<TagResponseDto[]> {
    return this.service.upsert(auth, dto);
  }

  @Put('assets')
  @Authenticated({ permission: Permission.TagAsset })
  @ApiOperation({
    summary: 'Tag assets',
    description: 'Add multiple tags to multiple assets in a single request.',
  })
  bulkTagAssets(@Auth() auth: AuthDto, @Body() dto: TagBulkAssetsDto): Promise<TagBulkAssetsResponseDto> {
    return this.service.bulkTagAssets(auth, dto);
  }

  @Get(':id')
  @Authenticated({ permission: Permission.TagRead })
  @ApiOperation({
    summary: 'Retrieve a tag',
    description: 'Retrieve a specific tag by its ID.',
  })
  getTagById(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<TagResponseDto> {
    return this.service.get(auth, id);
  }

  @Put(':id')
  @Authenticated({ permission: Permission.TagUpdate })
  @ApiOperation({
    summary: 'Update a tag',
    description: 'Update an existing tag identified by its ID.',
  })
  updateTag(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto, @Body() dto: TagUpdateDto): Promise<TagResponseDto> {
    return this.service.update(auth, id, dto);
  }

  @Delete(':id')
  @Authenticated({ permission: Permission.TagDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a tag',
    description: 'Delete a specific tag by its ID.',
  })
  deleteTag(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.remove(auth, id);
  }

  @Put(':id/assets')
  @Authenticated({ permission: Permission.TagAsset })
  @ApiOperation({
    summary: 'Tag assets',
    description: 'Add a tag to all the specified assets.',
  })
  tagAssets(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: BulkIdsDto,
  ): Promise<BulkIdResponseDto[]> {
    return this.service.addAssets(auth, id, dto);
  }

  @Delete(':id/assets')
  @Authenticated({ permission: Permission.TagAsset })
  @ApiOperation({
    summary: 'Untag assets',
    description: 'Remove a tag from all the specified assets.',
  })
  untagAssets(
    @Auth() auth: AuthDto,
    @Body() dto: BulkIdsDto,
    @Param() { id }: UUIDParamDto,
  ): Promise<BulkIdResponseDto[]> {
    return this.service.removeAssets(auth, id, dto);
  }
}
