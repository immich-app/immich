import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BulkIdResponseDto, BulkIdsDto } from 'src/dtos/asset-ids.response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  MemoryCreateDto,
  MemoryResponseDto,
  MemorySearchDto,
  MemoryStatisticsResponseDto,
  MemoryUpdateDto,
} from 'src/dtos/memory.dto';
import { ApiTag, Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { MemoryService } from 'src/services/memory.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags(ApiTag.Memories)
@Controller('memories')
export class MemoryController {
  constructor(private service: MemoryService) {}

  @Get()
  @Authenticated({ permission: Permission.MemoryRead })
  @ApiOperation({
    summary: 'Retrieve memories',
    description:
      'Retrieve a list of memories. Memories are sorted descending by creation date by default, although they can also be sorted in ascending order, or randomly.',
  })
  searchMemories(@Auth() auth: AuthDto, @Query() dto: MemorySearchDto): Promise<MemoryResponseDto[]> {
    return this.service.search(auth, dto);
  }

  @Post()
  @Authenticated({ permission: Permission.MemoryCreate })
  @ApiOperation({
    summary: 'Create a memory',
    description:
      'Create a new memory by providing a name, description, and a list of asset IDs to include in the memory.',
  })
  createMemory(@Auth() auth: AuthDto, @Body() dto: MemoryCreateDto): Promise<MemoryResponseDto> {
    return this.service.create(auth, dto);
  }

  @Get('statistics')
  @Authenticated({ permission: Permission.MemoryStatistics })
  @ApiOperation({
    summary: 'Retrieve memories statistics',
    description: 'Retrieve statistics about memories, such as total count and other relevant metrics.',
  })
  memoriesStatistics(@Auth() auth: AuthDto, @Query() dto: MemorySearchDto): Promise<MemoryStatisticsResponseDto> {
    return this.service.statistics(auth, dto);
  }

  @Get(':id')
  @Authenticated({ permission: Permission.MemoryRead })
  @ApiOperation({
    summary: 'Retrieve a memory',
    description: 'Retrieve a specific memory by its ID.',
  })
  getMemory(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<MemoryResponseDto> {
    return this.service.get(auth, id);
  }

  @Put(':id')
  @Authenticated({ permission: Permission.MemoryUpdate })
  @ApiOperation({
    summary: 'Update a memory',
    description: 'Update an existing memory by its ID.',
  })
  updateMemory(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: MemoryUpdateDto,
  ): Promise<MemoryResponseDto> {
    return this.service.update(auth, id, dto);
  }

  @Delete(':id')
  @Authenticated({ permission: Permission.MemoryDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a memory',
    description: 'Delete a specific memory by its ID.',
  })
  deleteMemory(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.remove(auth, id);
  }

  @Put(':id/assets')
  @Authenticated({ permission: Permission.MemoryAssetCreate })
  @ApiOperation({
    summary: 'Add assets to a memory',
    description: 'Add a list of asset IDs to a specific memory.',
  })
  addMemoryAssets(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: BulkIdsDto,
  ): Promise<BulkIdResponseDto[]> {
    return this.service.addAssets(auth, id, dto);
  }

  @Delete(':id/assets')
  @Authenticated({ permission: Permission.MemoryAssetDelete })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove assets from a memory',
    description: 'Remove a list of asset IDs from a specific memory.',
  })
  removeMemoryAssets(
    @Auth() auth: AuthDto,
    @Body() dto: BulkIdsDto,
    @Param() { id }: UUIDParamDto,
  ): Promise<BulkIdResponseDto[]> {
    return this.service.removeAssets(auth, id, dto);
  }
}
